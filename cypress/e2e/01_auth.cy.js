// cypress/e2e/01_auth.cy.js
// Teste pentru autentificare, inregistrare si ban

const timestamp = Date.now();

describe('Autentificare - Login', () => {
  it('afiseaza formularul de login', () => {
    cy.visit('/login');
    cy.contains('h1', 'FaceBook').should('be.visible');
    cy.contains('label', 'Nume utilizator').should('exist');
    cy.contains('label', 'Parolă').should('exist');
    cy.contains('button', 'Autentificare').should('be.visible');
  });

  it('afiseaza eroare la camp gol', () => {
    cy.visit('/login');
    cy.contains('button', 'Autentificare').click();
    cy.contains('Completează toate câmpurile').should('be.visible');
  });

  it('afiseaza eroare la credentiale gresite', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type('userInexistent');
    cy.get('input[type="password"]').type('parolaGresita');
    cy.contains('button', 'Autentificare').click();
    cy.contains('Utilizator sau parolă incorectă').should('be.visible');
  });

  it('redireconeaza la /posts dupa login reusit', () => {
    // Cream user prin API, apoi login prin UI
    const user = `testUser_${timestamp}`;
    cy.apiRegister(user, `${user}@test.com`, 'parola123');
    cy.visit('/login');
    cy.get('input[type="text"]').type(user);
    cy.get('input[type="password"]').type('parola123');
    cy.contains('button', 'Autentificare').click();
    cy.url().should('include', '/posts');
  });

  it('navigheaza la pagina de register din login', () => {
    cy.visit('/login');
    cy.contains('a', 'Înregistrează-te').click();
    cy.url().should('include', '/register');
  });

  it('login functioneaza cu Enter pe camp parola', () => {
    const user = `testUserEnter_${timestamp}`;
    cy.apiRegister(user, `${user}@test.com`, 'parola123');
    cy.visit('/login');
    cy.get('input[type="text"]').type(user);
    cy.get('input[type="password"]').type('parola123{enter}');
    cy.url().should('include', '/posts');
  });
});

describe('Inregistrare - Register', () => {
  it('afiseaza formularul de inregistrare', () => {
    cy.visit('/register');
    cy.contains('h1', 'FaceBook').should('be.visible');
    cy.contains('Creează un cont nou').should('exist');
    cy.contains('button', 'Înregistrare').should('be.visible');
  });

  it('creeaza cont nou si redireconeaza', () => {
    const user = `newUser_${timestamp}`;
    cy.visit('/register');
    cy.get('input[type="text"]').type(user);
    cy.get('input[type="email"]').type(`${user}@test.com`);
    cy.get('input[type="password"]').type('parola123');
    cy.contains('button', 'Înregistrare').click();
    cy.url().should('include', '/posts');
  });

  it('afiseaza eroare la username duplicat', () => {
    const user = `dupUser_${timestamp}`;
    cy.apiRegister(user, `${user}@test.com`, 'parola123');
    cy.visit('/register');
    cy.get('input[type="text"]').type(user);
    cy.get('input[type="email"]').type(`alt_${user}@test.com`);
    cy.get('input[type="password"]').type('parola123');
    cy.contains('button', 'Înregistrare').click();
    cy.contains(/deja|luat|taken|conflict/i).should('be.visible');
  });

  it('navigheaza la login din register', () => {
    cy.visit('/register');
    cy.contains('a', 'Autentifică-te').click();
    cy.url().should('include', '/login');
  });
});

describe('Redirect guard - pagini protejate', () => {
  it('redireconeaza la login daca nu esti autentificat si accesezi /posts', () => {
    cy.clearLocalStorage();
    cy.visit('/posts');
    cy.url().should('include', '/login');
  });

  it('redireconeaza la login la acces direct /posts/:id', () => {
    cy.clearLocalStorage();
    cy.visit('/posts/1');
    cy.url().should('include', '/login');
  });

  it('redireconeaza la login la acces direct /users', () => {
    cy.clearLocalStorage();
    cy.visit('/users');
    cy.url().should('include', '/login');
  });
});
