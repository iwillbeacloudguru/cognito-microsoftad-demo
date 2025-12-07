import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { registerMfaDevice, getMfaDevices, deleteMfaDevice } from './api';

function MfaSettings({ user, onBack }) {
  const [totpRegistered, setTotpRegistered] = useState(false);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');

  useEffect(() => {
    loadMfaDevices();
  }, []);

  const loadMfaDevices = async () => {
    try {
      const devices = await getMfaDevices(user?.email);
      const hasTOTP = devices.some(d => d.device_type === 'totp' && d.is_active);
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
      setTotpRegistered(true);
      setShowTotpSetup(false);
      setTotpCode('');
      onBack();
    } catch (error) {
      console.error('Failed to save TOTP:', error);
      alert('Failed to register TOTP. Please try again.');
    }
  };

  const removeTotpMfa = async () => {
    if (window.confirm('Are you sure you want to remove TOTP MFA?')) {
      try {
        const devices = await getMfaDevices(user?.email);
        const totpDevice = devices.find(d => d.device_type === 'totp' && d.is_active);
        if (totpDevice) {
          await deleteMfaDevice(totpDevice.id);
        }
        setTotpRegistered(false);
      } catch (error) {
        console.error('Failed to remove TOTP:', error);
      }
    }
  };



  const getTotpUri = () => {
    const issuer = 'CognitoMFADemo';
    const accountName = user?.email || 'user@example.com';
    return `otpauth://totp/${issuer}:${accountName}?secret=${totpSecret}&issuer=${issuer}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🔒 MFA Settings</h1>
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            ← Back
          </button>
        </div>

        <div className="space-y-4">
          {/* TOTP MFA */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-lg font-semibold text-gray-800">Authenticator App (TOTP)</h3>
                  {totpRegistered && (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Active</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Use Google Authenticator, Microsoft Authenticator, or Authy to generate time-based codes
                </p>
              </div>
            </div>
            {totpRegistered ? (
              <button
                onClick={removeTotpMfa}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Remove TOTP
              </button>
            ) : (
              <button
                onClick={setupTotp}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Setup Authenticator
              </button>
            )}
          </div>


        </div>
      </div>

      {/* TOTP Setup Modal */}
      {showTotpSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📱 Setup Authenticator App</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app
            </p>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 flex justify-center">
              <QRCodeSVG value={getTotpUri()} size={200} />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 mb-1">Or enter this secret key manually:</p>
              <p className="font-mono text-sm text-gray-800 break-all">{totpSecret}</p>
            </div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              maxLength="6"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-center text-lg font-mono"
            />
            <div className="flex gap-3">
              <button
                onClick={verifyAndRegisterTotp}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Verify & Register
              </button>
              <button
                onClick={() => { setShowTotpSetup(false); setTotpCode(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default MfaSettings;
