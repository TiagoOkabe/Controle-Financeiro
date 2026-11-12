# Como publicar (grátis, com endereço gratuito tipo seusite.pages.dev)

## O que você precisa (tudo grátis)
1. Conta na **Cloudflare** (cloudflare.com) – hospeda o site e roda a geração automática da chave.
2. Conta no **Mercado Pago** (a sua) – recebe o Pix. Em *Seu negócio > Configurações > Credenciais* (developers) pegue o **Access Token de produção**.
3. Conta no **GitHub** (para subir os arquivos).

## Passo a passo
1. Copie para dentro desta pasta as pastas `assets/` e `downloads/` do seu site atual (não vieram no upload).
2. Crie um repositório no GitHub e suba TODO o conteúdo desta pasta (inclusive `functions/`). **NÃO suba o Gerador_de_Chaves_VENDEDOR.html.**
3. Cloudflare > Workers & Pages > Create > Pages > Connect to Git > escolha o repositório. Sem build command; output directory: `/`. Você recebe um endereço `nome.pages.dev` grátis.
4. Cloudflare > Workers & Pages > KV > Create namespace `LICENCAS`.
5. No projeto Pages > Settings > Bindings > Add > KV namespace: variável `LICENCAS` → namespace criado.
6. Settings > Variables and Secrets (Production), adicione como **Secret**:
   - `MP_ACCESS_TOKEN` = seu Access Token de produção do Mercado Pago
   - `D_PRIVADA` = a chave privada que está no seu Gerador (a constante D_PRIVADA, 64 caracteres)
   - `PRECO` = 19.90
7. Refaça o deploy (Deployments > Retry). Teste pagando R$ 19,90 de verdade (pode ser você mesmo).

## Segurança (importante)
- A chave privada NUNCA fica em arquivo público: só como Secret. Seu Gerador continua valendo como plano B manual.
- Cada pagamento gera chave para UM código de dispositivo. Quem pedir troca de computador, você libera pelo Gerador.
- Se o Gerador_de_Chaves_VENDEDOR.html já foi enviado a alguém ou publicado, troque o par de chaves (o programa precisa ser regenerado com a nova pública).
- O .zip em `downloads/` é público; o que protege o programa é a chave de ativação.
