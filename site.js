const express = require("express"); //adiciona o express na sua aplicação
const session = require("express-session"); //adiciona o gerenciador de session do express
const sqlite3 = require("sqlite3").verbose(); //adiciona a biblioteca para manipular arquivos do SQLite3

const app = express(); //armazena as chamadas e propriedades da biblioteca express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = 8000; //configura a porta TCP do express

//conexão com oo BD
const db = new sqlite3.Database("doacao.db");
db.serialize(() => {
    db.run(
        "CREATE TABLE IF NOT EXISTS login (id INTEGER PRIMARY KEY AUTOINCREMENT, nomecompleto TEXT, email TEXT, senha TEXT, confirmarsenha TEXT)"
    );
    db.run(
        "CREATE TABLE IF NOT EXISTS doar (id INTEGER PRIMARY KEY AUTOINCREMENT, item_doado INT, quantidade INT, data DATE, codigo_da_sala TEXT, docente TEXT, pontuacao_final INT, usuario_id INT)"
    );
});

//configura a rota '/static' para a pasta '__dirname/static' do seu servidor
app.use('/static', express.static(__dirname + '/static'));

app.use(
    session({
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
        req.session.usuario_id = this.lastID;
        res.redirect("/");
    });
});

app.get("/ranking", (req, res) => {
    console.log("GET /ranking")
    const query = `
  SELECT codigo_da_sala,
         SUM(item_doado * quantidade) AS pontuacao_total,
         SUM(quantidade) AS total_itens,
         MAX(data) AS ultima_data,
         MAX(docente) AS docente
  FROM doar
  GROUP BY codigo_da_sala
  ORDER BY pontuacao_total DESC
`;
    db.all(query, [], (err, row) => {
        if (err) throw err;
        console.log(JSON.stringify(row));
        //renderiza a pagina ranking com a lista de doacoes coletada do BD pelo SELECT 
        res.render("pages/ranking", { titulo: "Tabela de Ranking", dados: row, req: req });
    });
})

app.get("/confirmacao", (req, res) => {
    res.render("pages/confirmacao", { titulo: "CONFIRMAÇÃO", req: req });
});

app.get("/info", (req, res) => {
    console.log("GET /info")
    res.render("pages/info");
})

app.get("/doar", (req, res) => {
    if (!req.session.usuario_id) {
        return res.redirect("/confirmacao");
    }
    res.render("pages/doar", { req: req });
});
app.post("/doar", (req, res) => {
    const { item_doado, quantidade, data, codigo_da_sala, docente } = req.body;
    const usuario_id = req.session.usuario_id;
    const pontuacao_final = item_doado * quantidade;

    const query = `INSERT INTO doar (item_doado, quantidade, data, codigo_da_sala, docente, usuario_id, pontuacao_final)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [item_doado, quantidade, data, codigo_da_sala, docente, usuario_id, pontuacao_final], function (err) {
        if (err) throw err;
        res.redirect("/conclusao");
    });
});

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

app.use('/{*erro}', (req, res) => {
    //Envia uma resposta de erro 404
    res.status(404).render('pages/erro', { titulo: "ERRO 404", req: req, msg: "404" });
});

app.listen(PORT, () => {
    console.log(`Servidor sendo executado na porta ${PORT}`);
    console.log(__dirname + "/static");
});