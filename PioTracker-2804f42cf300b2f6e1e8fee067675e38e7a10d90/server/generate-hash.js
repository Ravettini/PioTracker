const argon2 = require('argon2');

async function generateHash() {
  const password = 'Cambiar.123';
  const hash = await argon2.hash(password);
  console.log('Hash generado para:', password);
  console.log('Hash:', hash);
  
  // Verificar que funciona
  const isValid = await argon2.verify(hash, password);
  console.log('Verificación:', isValid);
}

generateHash().catch(console.error);



