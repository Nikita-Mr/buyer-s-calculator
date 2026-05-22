// update-version.js
import fs from 'fs';
import { execSync } from 'child_process';

// Читаем текущую версию
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const newVersion = packageJson.version;

// Обновляем version.json
const versionJson = { 
  version: newVersion, 
  date: new Date().toISOString().slice(0, 10) 
};
fs.writeFileSync('public/version.json', JSON.stringify(versionJson, null, 2));

console.log(`✅ Версия обновлена до ${newVersion}`);

// Автоматический коммит
try {
  execSync('git add public/version.json');
  execSync(`git commit -m "Обновление версии до ${newVersion}" --no-verify`);
  console.log('✅ Коммит создан');
} catch (error) {
  console.log('⚠️ Не удалось создать коммит автоматически');
}