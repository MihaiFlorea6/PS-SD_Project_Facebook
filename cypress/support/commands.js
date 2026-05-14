// cypress/support/commands.js

/**
 * Comanda custom: loginAs(username, password)
 * Completeaza formularul de login si apasa butonul
 */
Cypress.Commands.add('loginAs', (username, password) => {
  cy.visit('/login');
  cy.get('input[type="text"]').clear().type(username);
  cy.get('input[type="password"]').clear().type(password);
  cy.contains('button', 'Autentificare').click();
});

/**
 * Comanda custom: registerUser(username, email, password)
 */
Cypress.Commands.add('registerUser', (username, email, password) => {
  cy.visit('/register');
  cy.get('input[type="text"]').clear().type(username);
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.contains('button', 'Înregistrare').click();
});

/**
 * Comanda custom: apiRegister — inregistreaza user direct prin API
 */
Cypress.Commands.add('apiRegister', (username, email, password) => {
  cy.request('POST', 'http://localhost:8080/api/users', { username, email, password });
});

/**
 * Comanda custom: apiLogin — logheaza user direct prin API si salveaza in localStorage
 */
Cypress.Commands.add('apiLogin', (username, password) => {
  cy.request('POST', 'http://localhost:8080/api/auth/login', { username, password }).then((resp) => {
    window.localStorage.setItem('currentUser', JSON.stringify(resp.body));
  });
});

/**
 * Comanda custom: apiPromote — promoveaza user la MODERATOR
 */
Cypress.Commands.add('apiPromote', (userId) => {
  cy.request('POST', `http://localhost:8080/api/users/${userId}/promote`);
});
