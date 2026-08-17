/** Remove tudo que não é dígito. */
export function normalizarCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function formatarCPF(cpf: string): string {
  const d = normalizarCPF(cpf).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Validação padrão de CPF (dígitos verificadores), rejeita sequências repetidas (ex: 111.111.111-11). */
export function validarCPF(cpf: string): boolean {
  const d = normalizarCPF(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digitos = d.split("").map(Number);
  const calcularDigito = (base: number[]) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += base[i] * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const dv1 = calcularDigito(digitos.slice(0, 9));
  if (dv1 !== digitos[9]) return false;
  const dv2 = calcularDigito(digitos.slice(0, 10));
  if (dv2 !== digitos[10]) return false;

  return true;
}
