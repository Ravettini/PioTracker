import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isValidPeriodo', async: false })
export class IsValidPeriodo implements ValidatorConstraintInterface {
  validate(periodo: string, args: ValidationArguments) {
    if (!periodo || typeof periodo !== 'string') {
      return false;
    }

    // Validar formato básico
    const periodosValidos = [
      /^\d{4}-\d{2}$/,           // YYYY-MM (mensual)
      /^\d{4}Q[1-4]$/,           // YYYYQn (trimestral)
      /^\d{4}S[1-2]$/,           // YYYYSn (semestral)
      /^\d{4}$/,                  // YYYY (anual)
    ];

    return periodosValidos.some(pattern => pattern.test(periodo));
  }

  defaultMessage(args: ValidationArguments) {
    return 'El período debe tener un formato válido (YYYY-MM, YYYYQn, YYYYSn, YYYY)';
  }
}








