const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const sendLog = (level, message) => {
  fetch(`${API_URL.replace('/v2', '')}/api/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, timestamp: new Date().toISOString() })
  }).catch(() => {});
};

export const setupLogger = () => {
  const originalConsole = { ...console };
  
  console.log = (...args) => {
    originalConsole.log(...args);
    sendLog('log', args.join(' '));
  };
  
  console.error = (...args) => {
    originalConsole.error(...args);
    sendLog('error', args.join(' '));
  };
};