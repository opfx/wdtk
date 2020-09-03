const dbgEnv = process.env['WX_DEBUG'];

export const isDebug = dbgEnv !== undefined && dbgEnv !== '0' && dbgEnv.toLowerCase() !== 'false';
