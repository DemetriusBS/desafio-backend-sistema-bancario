const bd = require("../bancodedados");
const { format } = require("date-fns");

async function listarContas(req, res) {
  const senha = req.query.senha_banco;

  if (senha && senha === bd.banco.senha) {
    res.status(200);
    res.json(bd.contas);
  } else {
    res.status(400);
    res.json({
      mensagem: "Senha inválida!",
    });
  }
}

async function criarConta(req, res) {
  const novaConta = req.body;

  if (bd.contas.length > 0) {
    const ultimaPosicao = bd.contas.length - 1;
    let novoNumero = bd.contas[ultimaPosicao].numero;

    const resultCpf = bd.contas.find(
      (elemento) => elemento.usuario.cpf === novaConta.cpf
    );

    if (resultCpf) {
      res.status(400);
      res.json({
        mensagem: "O CPF informado já existe!",
      });
      return;
    }

    const resultEmail = bd.contas.find(
      (elemento) => elemento.usuario.email === novaConta.email
    );

    if (resultEmail) {
      res.status(400);
      res.json({
        mensagem: "O E-mail informado já existe!",
      });
      return;
    }

    if (
      novaConta.nome &&
      novaConta.cpf &&
      novaConta.data_nascimento &&
      novaConta.telefone &&
      novaConta.email &&
      novaConta.senha
    ) {
      const conta = {
        numero: novoNumero + 1,
        saldo: 0,
        usuario: {
          nome: novaConta.nome,
          cpf: novaConta.cpf,
          data_nascimento: novaConta.data_nascimento,
          telefone: novaConta.telefone,
          email: novaConta.email,
          senha: novaConta.senha,
        },
      };

      bd.contas.push(conta);
      res.status(201);
      res.json(conta);
    } else {
      res.status(400);
      res.json({
        mensagem: "Todos os campos devem ser informados!",
      });
    }
  } else {
    const newConta = {
      numero: 1,
      saldo: 0,
      usuario: {
        nome: novaConta.nome,
        cpf: novaConta.cpf,
        data_nascimento: novaConta.data_nascimento,
        telefone: novaConta.telefone,
        email: novaConta.email,
        senha: novaConta.senha,
      },
    };

    bd.contas.push(newConta);
    res.status(201);
    res.json(newConta);
  }
}

async function atualizarUsuarioConta(req, res) {
  const body = req.body;
  if (!body) {
    res.status(400);
    res.json({
      mensagem: "Ao menos um campo deve ser passado no body!",
    });
  } else {
    const numConta = Number(req.params.numeroConta);

    const conta = bd.contas.find((elemento) => elemento.numero === numConta);

    if (conta) {
      const buscaCpf = bd.contas.find(
        (elemento) => elemento.usuario.cpf === body.cpf
      );

      if (buscaCpf && buscaCpf.numero !== conta.numero) {
        res.status(400);
        res.json({
          mensagem: "O cpf informado já existe!",
        });
        return;
      }

      const buscaEmail = bd.contas.find(
        (elemento) => elemento.usuario.email === body.email
      );

      if (buscaCpf && buscaEmail.numero !== conta.numero) {
        res.status(400);
        res.json({
          mensagem: "O E-mail informado já existe!",
        });
      }

      if (body.nome) {
        conta.usuario.nome = body.nome;
      }

      if (body.cpf) {
        conta.usuario.cpf = body.cpf;
      }

      if (body.data_nascimento) {
        conta.usuario.data_nascimento = body.data_nascimento;
      }

      if (body.telefone) {
        conta.usuario.telefone = body.telefone;
      }

      if (body.email) {
        conta.usuario.email = body.email;
      }

      if (body.senha) {
        conta.usuario.senha = body.senha;
      }
      res.status(200);
      res.json({
        mensagem: "Conta atualizada com sucesso!",
      });
    } else {
      res.status(404);
      res.json({
        mensagem: "Conta inválida!",
      });
    }
  }
}

async function excluirConta(req, res) {
  const numeroDaConta = Number(req.params.numeroConta);

  const resultado = bd.contas.find(
    (elemento) => elemento.numero === numeroDaConta
  );

  if (resultado) {
    if (resultado.saldo !== 0) {
      res.status(400);
      res.json({
        mensagem:
          "Só é permitido excluir uma conta se o saldo for igual a zero!",
      });
    } else {
      const indice = bd.contas.indexOf(resultado);
      bd.contas.splice(indice, 1);
      res.status(200);
      res.json({
        mensagem: "Conta excluída com sucesso!",
      });
    }
  } else {
    res.status(404);
    res.json({
      mensagem: "O número da conta não foi encontrado!",
    });
  }
}

async function depositar(req, res) {
  const numero_conta = Number(req.body.numero_conta);
  const valor_deposito = Number(req.body.valor);
  if (numero_conta && valor_deposito) {
    const contaBancaria = bd.contas.find(
      (elemento) => elemento.numero === numero_conta
    );

    if (contaBancaria) {
      if (valor_deposito <= 0) {
        res.status(400);
        res.json({
          mensagem: "O valor de depósito não é permitido!",
        });
      } else {
        contaBancaria.saldo += valor_deposito;
        const data_atual = new Date();

        bd.depositos.push({
          data: format(data_atual, "yyyy-MM-dd' 'HH:mm:ss"),
          numero_conta: req.body.numero_conta,
          valor: valor_deposito,
        });
        res.status(201);
        res.json({
          mensagem: "Depósito realizado com sucesso!",
        });
      }
    } else {
      res.status(404);
      res.json({
        mensagem: "A conta informada não foi encontrada!",
      });
    }
  } else {
    res.status(400);
    res.json({
      mensagem:
        "O número da conta e o valor são necessários para realizar o depósito!",
    });
  }
}

async function sacar(req, res) {
  const numero_conta = Number(req.body.numero_conta);
  const valor_saque = Number(req.body.valor);
  const senha = req.body.senha;

  if (numero_conta && valor_saque && senha) {
    const contaBancaria = bd.contas.find(
      (elemento) => elemento.numero === numero_conta
    );
    if (contaBancaria) {
      if (contaBancaria.usuario.senha === senha) {
        if (contaBancaria.saldo >= valor_saque) {
          contaBancaria.saldo -= valor_saque;
          const data_atual = new Date();
          bd.saques.push({
            data: format(data_atual, "yyyy-MM-dd' 'HH:mm:ss"),
            numero_conta: req.body.numero_conta,
            valor: req.body.valor,
          });
          res.status(200);
          res.json({
            mensagem: "Saque realizado com sucesso!",
          });
        } else {
          res.status(400);
          res.json({
            mensagem: "O saldo é insuficiente!",
          });
        }
      } else {
        res.status(400);
        res.json({
          mensagem: "A senha informada está errada!",
        });
      }
    } else {
      res.status(404);
      res.json({
        mensagem: "A conta bancária informada não existe!",
      });
    }
  } else {
    res.status(400);
    res.json({
      mensagem:
        "Os campos com número da conta, valor e senha devem ser inseridos!",
    });
  }
}

async function transferir(req, res) {
  const numero_conta_origem = Number(req.body.numero_conta_origem);
  const numero_conta_destino = Number(req.body.numero_conta_destino);
  const valor = req.body.valor;
  const senha = req.body.senha;

  if (numero_conta_origem && numero_conta_destino && valor && senha) {
    let contaOrigem = bd.contas.find(
      (elemento) => elemento.numero === numero_conta_origem
    );
    let contaDestino = bd.contas.find(
      (elemento) => elemento.numero === numero_conta_destino
    );

    if (contaOrigem && contaDestino) {
      if (contaOrigem.usuario.senha === senha) {
        if (contaOrigem.saldo <= 0 || valor > contaOrigem.saldo) {
          res.status(400);
          res.json({
            mensagem: "Não há saldo suficiente para transferência!",
          });
        } else {
          contaOrigem.saldo -= valor;
          contaDestino.saldo += valor;
          const data_atual = new Date();
          bd.transferencias.push({
            data: format(data_atual, "yyyy-MM-dd' 'HH:mm:ss"),
            numero_conta_origem: req.body.numero_conta_origem,
            numero_conta_destino: req.body.numero_conta_destino,
            valor: req.body.valor,
          });
          res.status(201);
          res.json({
            mensagem: "Transferência realizada com sucesso!",
          });
        }
      } else {
        res.status(400);
        res.json({
          mensagem: "A senha informada está errada!",
        });
      }
    } else {
      res.status(404);
      res.json({
        mensagem: "Uma das contas não existe!",
      });
    }
  } else {
    res.status(400);
    res.json({
      mensagem:
        "É necessário informar o número da conta de origem, conta destino, valor e senha da conta de origem",
    });
  }
}

async function saldo(req, res) {
  const numero_conta = Number(req.query.numero_conta);
  const senha = req.query.senha;

  if (numero_conta && senha) {
    const contaBancaria = bd.contas.find(
      (elemento) => elemento.numero === numero_conta
    );

    if (contaBancaria) {
      if (senha === contaBancaria.usuario.senha) {
        res.status(200);
        res.json({
          saldo: contaBancaria.saldo,
        });
      } else {
        res.status(400);
        res.json({
          mensagem: "A senha está incorreta1",
        });
      }
    } else {
      res.status(404);
      res.json({
        mensagem: "A conta informada não existe!",
      });
    }
  } else {
    res.status(400);
    res.json({
      mensagem: "O número da conta e a senha devem ser informados!",
    });
  }
}

async function extrato(req, res) {
  const numero_conta = Number(req.query.numero_conta);
  const senha = req.query.senha;

  if (numero_conta && senha) {
    const contaBancaria = bd.contas.find(
      (elemento) => elemento.numero === numero_conta
    );
    if (contaBancaria) {
      if (contaBancaria.usuario.senha === senha) {
        const depositos = bd.depositos.filter(
          (elemento) => elemento.numero_conta === req.query.numero_conta
        );
        const saques = bd.saques.filter(
          (elemento) => elemento.numero_conta === req.query.numero_conta
        );
        const transferencias_feitas = bd.transferencias.filter(
          (elemento) => elemento.numero_conta_origem === req.query.numero_conta
        );

        const transferencias_recebidas = bd.transferencias.filter(
          (elemento) => elemento.numero_conta_destino === req.query.numero_conta
        );

        res.status(201);
        res.json({
          depositos: depositos,
          saques: saques,
          transferenciasEnviadas: transferencias_feitas,
          transferenciasRecebidas: transferencias_recebidas,
        });
      } else {
        res.status(400);
        res.json({
          mensagem: "A senha informada está incorreta!",
        });
      }
    } else {
      res.status(404);
      res.json({
        mensagem: "A conta informada não existe!",
      });
    }
  } else {
    res.status(400);
    res.json({
      mensagem: "O número da conta e a senha devem ser informados!",
    });
  }
}

module.exports = {
  listarContas,
  criarConta,
  atualizarUsuarioConta,
  excluirConta,
  depositar,
  sacar,
  transferir,
  saldo,
  extrato,
};
