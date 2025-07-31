// Funções utilitárias para validação de dados

export function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isRequired(value) {
  return value !== undefined && value !== null && value !== "";
}

export function minLength(value, length) {
  return (value || "").length >= length;
}

export function buscarProcessoPorNumero(value, length) {
  if (!value) {
        throw new Error('Número do processo é obrigatório');  
      }
      // Verifica se o número do processo é válido
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error('Número do processo deve ser uma string não vazia');
      }
      // Busca o processo pelo número
      console.log(`[DEBUG] Buscando processo por número: ${value}`);
      if (value.length < 5) {
        throw new Error('Número do processo deve ter pelo menos 5 caracteres');
      }
      if (value.length > 20) {
        throw new Error('Número do processo deve ter no máximo 20 caracteres');
      }
      if (!/^[a-zA-Z0-9-]+$/.test(value)) {
        throw new Error('Número do processo contém caracteres inválidos');    
      }
      console.log(`[DEBUG] Executando busca por número: ${value}`);

}