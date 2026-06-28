import SystemSetting from '../models/SystemSetting.js';

const cache = {};

export async function getSetting(key, defaultValue) {
  if (cache[key] !== undefined) {
    return cache[key];
  }
  
  try {
    const setting = await SystemSetting.findOne({ key });
    if (setting) {
      cache[key] = setting.value;
      return setting.value;
    }
  } catch (err) {
    console.error(`Error reading setting ${key}:`, err);
  }
  
  return defaultValue;
}

export async function setSetting(key, value) {
  cache[key] = value;
  try {
    await SystemSetting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`Error writing setting ${key}:`, err);
    throw err;
  }
}
