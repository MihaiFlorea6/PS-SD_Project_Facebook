// cypress/e2e/05_users.cy.js
// Teste pentru gestionarea profilului de utilizator

const ts = Date.now();
const USER = `profileUser_${ts}`;
const EMAIL = `${USER}@test.com`;
const PASS = 'parola123';

before(() => {
  cy.apiRegister(USER, EMAIL, PASS);
});

beforeEach(() => {
  cy.apiLogin(USER, PASS);
  cy.visit('/users');
});

describe('Pagina utilizatori', () => {
  it('afiseaza titlul paginii', () => {
    cy.contains('h1', 'Utilizatori').should('be.visible');
  });

  it('afiseaza cardul userului curent cu badge Tu', () => {
    cy.contains('.user-card', USER).within(() => {
      cy.contains('.you-badge', 'Tu').should('be.visible');
    });
  });

  it('afiseaza email-ul utilizatorului', () => {
    cy.contains('.user-card', USER).within(() => {
      cy.contains(EMAIL).should('be.visible');
    });
  });

  it('afiseaza data inregistrarii', () => {
    cy.contains('.user-card', USER).within(() => {
      cy.get('.user-date').should('exist');
    });
  });
});

describe('Editare profil propriu', () => {
  it('afiseaza butonul Editează pe propriul card', () => {
    cy.contains('.user-card', USER).within(() => {
      cy.contains('button', 'Editează').should('be.visible');
    });
  });
});

describe('Navbar si navigare', () => {
  it('afiseaza navbar-ul cu link-uri', () => {
    cy.get('app-navbar').should('exist');
  });

  it('link-ul Postări din navbar duce la /posts', () => {
    cy.get('app-navbar').contains('a', /Postări|Posts/).click();
    cy.url().should('include', '/posts');
  });

  it('link-ul Utilizatori din navbar duce la /users', () => {
    cy.visit('/posts');
    cy.get('app-navbar').contains('a', /Utilizatori|Users/).click();
    cy.url().should('include', '/users');
  });
});
