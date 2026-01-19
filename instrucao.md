# Instruções para Requisição de Produtos (API Betel Tecnologia)

A API utiliza a URL base `https://api.beteltecnologia.com`.
Todas as requisições exigem os seguintes headers de autenticação:

- `access-token`: Seu token de acesso.
- `secret-access-token`: Seu token de acesso secreto.
- `Content-Type`: `application/json`

## 1. Requisição de Produtos (Listagem Geral)

Para listar os produtos, utilize o endpoint `/produtos`.

### Parâmetros (Query Params):
- `pagina`: Número da página (Padrão: 1)
- `limite`: Quantidade de registros por página (Padrão: 100)

**Exemplo:** Listar a primeira página com 100 produtos.
`GET https://api.beteltecnologia.com/produtos?pagina=1&limite=100`

---

## 2. Buscar Produtos por Categoria (Grupo)

Para filtrar por uma categoria específica, adicione o parâmetro `grupo_id`.
Primeiro, é necessário obter os IDs dos grupos através do endpoint `/grupos_produtos`.

### Listar Grupos:
`GET https://api.beteltecnologia.com/grupos_produtos`

### Filtrar Produtos por Grupo:
- `grupo_id`: ID do grupo desejado.

**Exemplo:** Listar produtos do grupo com ID 123.
`GET https://api.beteltecnologia.com/produtos?pagina=1&limite=100&grupo_id=123`

---

## 3. Busca de Produtos (Pesquisa por Nome/Código)

Para buscar um produto por nome ou código, utilize o parâmetro `nome`.

### Parâmetros:
- `nome`: Termo de busca (nome ou código do produto).

**Exemplo:** Buscar produtos que contenham "arroz" no nome.
`GET https://api.beteltecnologia.com/produtos?pagina=1&limite=100&nome=arroz`

---

## Exemplo Detalhado (CURL)

Abaixo está um exemplo completo de como realizar uma requisição utilizando `curl`, incluindo os headers de autenticação e parâmetros de filtro (Categoria + Busca).

```bash
curl --location --request GET 'https://api.beteltecnologia.com/produtos?pagina=1&limite=100&grupo_id=123&nome=termo_busca' \
--header 'access-token: SEU_ACCESS_TOKEN_AQUI' \
--header 'secret-access-token: SEU_SECRET_ACCESS_TOKEN_AQUI' \
--header 'Content-Type: application/json'
```

### Explicação do Comando:

- `--location`: Segue redirecionamentos (se houver).
- `--request GET`: Define o método HTTP como GET.
- URL: `https://api.beteltecnologia.com/produtos`
  - `?pagina=1`: Solicita a primeira página.
  - `&limite=100`: Solicita 100 itens.
  - `&grupo_id=123`: (Opcional) Filtra pelo grupo 123.
  - `&nome=termo_busca`: (Opcional) Filtra pelo nome "termo_busca".
- `--header 'access-token: ...'`: Cabeçalho obrigatório com seu token público.
- `--header 'secret-access-token: ...'`: Cabeçalho obrigatório com seu token secreto.
