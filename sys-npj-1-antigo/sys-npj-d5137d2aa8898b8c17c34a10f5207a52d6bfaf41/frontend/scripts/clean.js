import fs from 'fs';
import path from 'path';

const cleanCache = () => {
  const cacheDir = path.resolve(process.cwd(), './node_modules/.cache');

  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('Cache limpo com sucesso!');
  } else {
    console.log('Nenhum cache encontrado para limpar.');
  }
};

cleanCache();
