const express = require('express');
const router  = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
  // Gets the user id from the database
  const getUserId = (id) => {
    const queryString = `
    SELECT * FROM users
    WHERE id = $1
    `;
    const values = [id];
    return db.query(queryString, values)
      .then(res => res.rows[0].id)
      .catch(e => res.send(e));
  };

  // Get register page
  router.get("/", (req, res) => {
   // Set the user id with the id in the database
    const userId = getUserId(req.session["user_id"]);
    const templateVars = {
      user_id: userId
    };
    return res.render("register", templateVars);
  });

  // Checks if an email is already in the database
  const getUserByEmail = (email) => {
    const queryString = `
      SELECT * FROM users
      WHERE email = $1
      `;
    const values = [email];
    return db.query(queryString, values)
      .then(res => res.rows[0])
      .catch(e => res.send(e));
  };

  // Add user to database
  const addUser = (user) => {
    const queryString = `
    INSERT INTO users (username, email, password, avatar_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    const values = [user.username, user.email, user.password, user.avatar_id];
    return db.query(queryString, values)
      .then(res => {
        console.log(res.rows[0]);
        return res.rows[0];
      })
      .catch(e => res.send(e));
  };

  // Post and Create new user
  router.post("/", (req, res) => {
    const user = req.body;
    // Checks if the submitted email and password were empty and sends an error
    if (!user.email || !user.password) {
      return res.status(400).send("Invalid email or password");
    }
    // Hash the user's password
    user.password = bcrypt.hashSync(user.password, 12);
    // Generate a random avatar id for the user
    user.avatar_id = Math.floor(Math.random() * Math.floor(9) + 1);

    // Checks if the email is already in the database before registering the new account
    getUserByEmail(user.email)
      .then(email => {
        if (email) {
          return res.status(400).send("Email already in use");
        } else {
          // Adds the user to the database
          addUser(user)
            .then(user => {
              // Sets cookie to the user's id
              req.session.userId = user.id;
              // Redirect to user's todo list after registering
              return res.redirect("/");
            })
            .catch(e => res.send(e));
        }
      });
  });

  return router;
};
