import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Pythondev",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let current_user_id = 1;


async function checkVisisted() {
  let response = await db.query("SELECT country_code FROM visited_countries INNER JOIN users ON users.id = visited_countries.user_id WHERE visited_countries.user_id = $1", [current_user_id]);
  let result = response.rows
  let countries = [];
  result.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function get_current_user(){
  let response = await db.query('SELECT * FROM users')
  let users = response.rows
  let current_user = users.find((user) => {
    return user.id == current_user_id
  })
  console.log(current_user)
  return current_user
}
app.get("/", async (req, res) => {
  let countries = await checkVisisted();
  let current_user = await get_current_user()
  let response = await db.query('SELECT * FROM users')
  let users = response.rows

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: current_user.color,
  });
});
app.post("/add", async (req, res) => {
  let user_input = req.body.country;
  
  try {
    let response = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [user_input.toLowerCase()]
    );

    let result = response.rows

    let data = result[0];
    let country_code = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [country_code, current_user_id]
      );
      res.redirect("/");
    } 
    catch (err) {
      console.log(err);
    }
  } 
  catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === `new`){
    res.render(`new.ejs`)
  }
  else{
    current_user_id = req.body.user
    res.redirect(`/`)
  }
});

app.post("/new", async (req, res) => {

  let name = req.body.name
  let color = req.body.color
  let response = await db.query('INSERT INTO users (name, color) VALUES ($1, $2) RETURNING *', [name, color])
  let result = response.rows
  
  current_user_id = result[0].id
  console.log(current_user_id)
  res.redirect(`/`)
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
