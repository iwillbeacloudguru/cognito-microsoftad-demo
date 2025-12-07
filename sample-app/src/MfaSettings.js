import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { registerMfaDevice, getMfaDevices, deleteMfaDevice } from './api';

function MfaSettings({ user, onBack }) {
  const [totpRegistered, setTotpRegistered] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [devices, setDevices] = useState([]);
  const [editDevice, setEditDevice] = useState(null);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    loadMfaDevices();
  }, []);

  const loadMfaDevices = async () => {
    try {
      const data = await getMfaDevices(user?.email);
      setDevices(data);
      const hasTOTP = data.some(d => d.device_type === 'totp' && d.is_active);
      setTotpRegistered(hasTOTP);
    } catch (error) {
      console.error('Failed to load MFA devices:', error);
    }
  };



  const generateTotpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateTOTP = (secret) => {
    const base32Decode = (str) => {
      const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let bits = '';
      for (let i = 0; i < str.length; i++) {
        const val = base32Chars.indexOf(str.charAt(i).toUpperCase());
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
      }
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substr(i, 8), 2));
      }
      return new Uint8Array(bytes);
    };

    const hmacSha1 = async (key, message) => {
      const cryptoKey = await crypto.subtle.importKey(
        'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
      );
      return await crypto.subtle.sign('HMAC', cryptoKey, message);
    };

    return (async () => {
      const epoch = Math.floor(Date.now() / 1000);
      const time = Math.floor(epoch / 30);
      const timeBytes = new ArrayBuffer(8);
      const timeView = new DataView(timeBytes);
      timeView.setUint32(4, time, false);

      const keyBytes = base32Decode(secret);
      const hmac = await hmacSha1(keyBytes, timeBytes);
      const hmacArray = new Uint8Array(hmac);
      
      const offset = hmacArray[hmacArray.length - 1] & 0x0f;
      const code = (
        ((hmacArray[offset] & 0x7f) << 24) |
        ((hmacArray[offset + 1] & 0xff) << 16) |
        ((hmacArray[offset + 2] & 0xff) << 8) |
        (hmacArray[offset + 3] & 0xff)
      ) % 1000000;
      
      return code.toString().padStart(6, '0');
    })();
  };

  const setupTotp = () => {
    const secret = generateTotpSecret();
    setTotpSecret(secret);
    setShowTotpSetup(true);
  };

  const verifyAndRegisterTotp = async () => {
    if (totpCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    const validCode = await generateTOTP(totpSecret);
    if (totpCode !== validCode) {
      alert('Invalid code. Please try again.');
      return;
    }

    try {
      await registerMfaDevice(user?.email, 'totp', 'Authenticator App', totpSecret, null);
      setShowTotpSetup(false);
      setTotpCode('');
      loadMfaDevices();
      onBack();
    } catch (error) {
      console.error('Failed to save TOTP:', error);
      alert('Failed to register TOTP. Please try again.');
    }
  };

  const removeTotpMfa = async () => {
    if (window.confirm('Are you sure you want to remove TOTP MFA?')) {
      try {
        const totpDevice = devices.find(d => d.device_type === 'totp' && d.is_active);
        if (totpDevice) {
          await deleteMfaDevice(totpDevice.id);
        }
        loadMfaDevices();
      } catch (error) {
        console.error('Failed to remove TOTP:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this MFA device?')) {
      try {
        await deleteMfaDevice(id);
        loadMfaDevices();
      } catch (error) {
        alert('Failed to delete device');
      }
    }
  };

  const handleUpdate = async (device) => {
    setEditDevice(device);
    setDeviceName(device.device_name);
  };

  const saveUpdate = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/mfa/${editDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_name: deviceName }),
      });
      setEditDevice(null);
      loadMfaDevices();
    } catch (error) {
      alert('Failed to update device');
    }
  };



  const getTotpUri = () => {
    const issuer = 'CognitoMFADemo';
    const accountName = user?.email || 'user@example.com';
    return `otpauth://totp/${issuer}:${accountName}?secret=${totpSecret}&issuer=${issuer}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">MFA Settings</h1>
              {totpRegistered && (
                <button onClick={onBack} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  ← Back
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Authenticator App (TOTP)</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Use Google Authenticator, Microsoft Authenticator, or Authy
                      </p>
                    </div>
                    {totpRegistered && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    {totpRegistered ? (
                      <button
                        onClick={removeTotpMfa}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove TOTP
                      </button>
                    ) : (
                      <button
                        onClick={setupTotp}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Setup Authenticator
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {devices.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Registered Devices</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Used</th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {devices.map((device) => (
                        <tr key={device.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {device.device_type.toUpperCase()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{device.device_name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              device.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {device.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(device.created_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {device.last_used_at ? new Date(device.last_used_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleUpdate(device)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(device.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTotpSetup && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Setup Authenticator App</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Scan this QR code with your authenticator app
                </p>
                <div className="bg-white p-4 border border-gray-200 rounded-md mb-4 flex justify-center">
                  <QRCodeSVG value={getTotpUri()} size={200} />
                </div>
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Or enter this secret key manually:</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{totpSecret}</p>
                </div>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg font-mono"
                />
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  onClick={verifyAndRegisterTotp}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  Verify & Register
                </button>
                <button
                  onClick={() => { setShowTotpSetup(false); setTotpCode(''); }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editDevice && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Device</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  onClick={saveUpdate}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditDevice(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MfaSettings;
