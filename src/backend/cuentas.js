
class Cuentas{
    constructor(numeroCuenta,saldoInicial=0){
        
        this.numeroCuenta=numeroCuenta;
        this.saldoInicial=saldoInicial;
        this.historial=[];
    }

    consultarSaldo(){
        return`saldo de ${this.numeroCuenta}: $${this.saldo}`
    }

    realizarDeposito(monto){
        if(monto <= 0){
            return `El monto debe ser mayor a 0`
        }
        this.saldo += monto;
        this.historial.push(`Deposito: $${monto}`)
        return `Consignacion exitosa de: $${monto}. Nuevo saldo: $${this.saldo}`
    }

    realizarRetiro(monto){
        if(monto <=0){
            return`monto debe ser mayor a 0`
        }
        if(monto > this.saldo){
            return `Saldo insuficiente`
        }
        this.saldo -= monto;
        this.historial.push(`Retiro: $${monto}`)
        return `Retiro de $${monto} saldo de la cuenta: $${this.saldo}`
    }
}