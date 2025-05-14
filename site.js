const express = require("express"); //adiciona o express na sua aplicação
const session = require("express-session"); //adiciona o gerenciador de session do express
const sqlite3 = require("sqlite3").verbose(); //adiciona a biblioteca para manipular arquivos do SQLite3

const app = express(); //armazena as chamadas e propriedades da biblioteca express

const PORT = 8000; //configura a porta TCP do express

//conexão com oo BD
const db = new sqlite3.Database("doacao.db");
db.serialize(() => {
    db.run("DROP TABLE IF EXISTS doacao");
    db.run(
        "CREATE TABLE IF NOT EXISTS login (id INTEGER PRIMARY KEY AUTOINCREMENT, nomecompleto TEXT, email TEXT, senha TEXT, confirmarsenha TEXT)"
    );
});

//configura a rota '/static' para a pasta '__dirname/static' do seu servidor
app.use('/static', express.static(__dirname + '/static'));

app.use(session({
    secret: 'segredo', // pode ser qualquer string
    resave: false,
    saveUninitialized: true
}));

//configuração Express para processar requisições POST com BODY PARAMETERS
//app.use(bodyparser.urlencoded({extended: true})); - Versão Express <= 4.x.x
app.use(express.urlencoded({ extended: true })); // Versão Express <= 5.x.x

app.set('view engine', 'ejs'); //habilita a 'view engine' para usar o 'ejs'

//rota '/' (raiz) para o método GET /
app.get("/", (req, res) => {
    const nome = req.session.AlunoLogado || null;
    res.render("pages/index", { nome });
    console.log("Nome da sessão:", req.session.AlunoLogado);
})

app.get("/login", (req, res) => {
    const mensagem = req.query.mensagem || "";
    res.render("pages/login", { mensagem });
})
app.post("/login", (req, res) => {
    const { nomecompleto, email, senha, confirmarsenha } = req.body;

    if (senha !== confirmarsenha) {
        return res.redirect("/login?mensagem=As senhas não batem");
    }

    const insertQuery = "INSERT INTO login (nomecompleto, email, senha, confirmarsenha) VALUES (?, ?, ?, ?)";
    db.run(insertQuery, [nomecompleto, email, senha, confirmarsenha], function (err) {
        if (err) throw err;
        req.session.AlunoLogado = nomecompleto;
        res.redirect("/");
    });
});

app.get("/ranking", (req, res) => {
    console.log("GET /ranking")
    res.render("pages/ranking");
})

app.get("/info", (req, res) => {
    console.log("GET /info")
    res.render("pages/info");
})

app.get("/doar", (req, res) => {
    console.log("GET /doar")
    res.render("pages/doar");
})

app.get("/conclusao", (req, res) => {
    console.log("GET /conclusao")
    res.render("pages/conclusao");
})

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect("/");
      }
      res.redirect("/");
    });
  })

app.listen(PORT, () => {
    console.log(`Servidor sendo executado na porta ${PORT}`);
    console.log(__dirname + "/static");
});