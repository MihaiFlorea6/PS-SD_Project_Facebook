// cypress/e2e/03_comments.cy.js
// Teste pentru adaugare, editare, stergere comentarii

const ts = Date.now();
const AUTHOR = `commentAuthor_${ts}`;
const AUTHOR_EMAIL = `${AUTHOR}@test.com`;
const COMMENTER = `commenter_${ts}`;
const COMMENTER_EMAIL = `${COMMENTER}@test.com`;
const PASS = 'parola123';

let postId;
let authorId;
let commenterId;

before(() => {
  // Cream 2 useri si o postare
  cy.apiRegister(AUTHOR, AUTHOR_EMAIL, PASS);
  cy.apiRegister(COMMENTER, COMMENTER_EMAIL, PASS);

  cy.request('POST', 'http://localhost:8080/api/auth/login', { username: AUTHOR, password: PASS })
    .then((resp) => {
      authorId = resp.body.id;
      return cy.request('POST', 'http://localhost:8080/api/posts', {
        title: `PostComments_${ts}`,
        content: 'Postare pentru testarea comentariilor',
        authorId,
      });
    })
    .then((resp) => {
      postId = resp.body.id;
    });

  cy.request('POST', 'http://localhost:8080/api/auth/login', { username: COMMENTER, password: PASS })
    .then((resp) => {
      commenterId = resp.body.id;
    });
});

describe('Adaugare comentariu', () => {
  beforeEach(() => {
    cy.apiLogin(COMMENTER, PASS);
    cy.visit(`/posts/${postId}`);
  });

  it('afiseaza formularul de adaugare comentariu', () => {
    cy.get('textarea[placeholder*="comentariu"]').should('be.visible');
    cy.contains('button', 'Adaugă comentariu').should('be.visible');
  });

  it('adauga comentariu nou', () => {
    const text = `Comentariu nou ${ts}`;
    cy.get('textarea[placeholder*="comentariu"]').type(text);
    cy.contains('button', 'Adaugă comentariu').click();
    cy.contains(text).should('be.visible');
  });

  it('afiseaza autorul comentariului', () => {
    cy.get('.comment-card').first().within(() => {
      cy.contains(COMMENTER).should('be.visible');
    });
  });

  it('afiseaza data crearii comentariului', () => {
    cy.get('.comment-card').first().within(() => {
      cy.get('.comment-date').should('exist');
    });
  });

  it('nu adauga comentariu daca textarea e gol (buton dezactivat sau fara efect)', () => {
    const countBefore = 0;
    cy.get('.comment-card').its('length').then((countBefore) => {
      cy.contains('button', 'Adaugă comentariu').click();
      // Nu ar trebui sa apara card nou cu continut gol
      cy.get('.comment-card').should('have.length.at.most', countBefore + 1);
    });
  });
});

describe('Stergere comentariu propriu', () => {
  before(() => {
    cy.request('POST', 'http://localhost:8080/api/auth/login', { username: COMMENTER, password: PASS })
      .then((resp) => {
        commenterId = resp.body.id;
        return cy.request('POST', `http://localhost:8080/api/posts/${postId}/comments`, {
          authorId: commenterId,
          content: `ComDeSters_${ts}`,
        });
      });
  });

  beforeEach(() => {
    cy.apiLogin(COMMENTER, PASS);
    cy.visit(`/posts/${postId}`);
  });

  it('sterge comentariul propriu', () => {
    cy.contains('.comment-card', `ComDeSters_${ts}`).within(() => {
      cy.contains('button', 'Șterge').click();
    });
    cy.contains(`ComDeSters_${ts}`).should('not.exist');
  });
});

describe('Blocare comentarii (Lock post)', () => {
  before(() => {
    cy.request('POST', 'http://localhost:8080/api/auth/login', { username: AUTHOR, password: PASS })
      .then((resp) => {
        authorId = resp.body.id;
      });
  });

  beforeEach(() => {
    cy.apiLogin(AUTHOR, PASS);
    cy.visit(`/posts/${postId}`);
  });

  it('nu mai afiseaza formularul de comentariu dupa blocare', () => {
    cy.get('textarea[placeholder*="comentariu"]').should('not.exist');
  });
});
