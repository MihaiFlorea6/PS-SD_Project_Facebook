// cypress/e2e/02_posts.cy.js
// Teste pentru creare, editare, stergere, filtrare postari

const ts = Date.now();
const USER = `postUser_${ts}`;
const EMAIL = `${USER}@test.com`;
const PASS = 'parola123';

before(() => {
  cy.apiRegister(USER, EMAIL, PASS);
});

beforeEach(() => {
  cy.apiLogin(USER, PASS);
  cy.visit('/posts');
});

describe('Lista postari', () => {
  it('afiseaza pagina cu titlul Postari', () => {
    cy.contains('h1', 'Postări').should('be.visible');
  });

  it('afiseaza butonul de postare noua', () => {
    cy.contains('a', '+ Postare nouă').should('be.visible');
  });

  it('afiseaza bara de cautare', () => {
    cy.get('input[placeholder*="Caută"]').should('exist');
    cy.contains('button', 'Caută').should('be.visible');
  });

  it('afiseaza butonul Toate', () => {
    cy.contains('button', 'Toate').should('be.visible');
  });

  it('afiseaza butonul Postările mele', () => {
    cy.contains('button', 'Postările mele').should('be.visible');
  });
});

describe('Creare postare', () => {
  it('afiseaza formularul de postare noua', () => {
    cy.contains('a', '+ Postare nouă').click();
    cy.url().should('include', '/posts/new');
    cy.contains('h1', 'Postare nouă').should('be.visible');
  });

  it('afiseaza eroare la submit fara titlu/continut (camp gol)', () => {
    cy.visit('/posts/new');
    cy.contains('button', 'Publică').click();
    // Butonul nu trebuie sa creeze postarea fara date
    cy.url().should('include', '/posts/new');
  });


  it('creeaza postare cu tag nou', () => {
    const title = `Postare cu Tag ${ts}`;
    cy.visit('/posts/new');
    cy.get('input[name="title"]').type(title);
    cy.get('textarea[name="content"]').type('Continut postare cu tag.');
    cy.get('input[name="tagInput"]').type('testcypress');
    cy.contains('button', '+ Adaugă').click();
    cy.contains('.tag-chip', '#testcypress').should('exist');
    cy.contains('button', 'Publică').click();
    cy.url().should('include', '/posts');
    cy.contains(title).should('be.visible');
  });

  it('butonul Anulează revine la lista de postari', () => {
    cy.visit('/posts/new');
    cy.contains('a', 'Anulează').click();
    cy.url().should('include', '/posts');
  });

  it('butonul Înapoi revine la lista de postari din post-form', () => {
    cy.visit('/posts/new');
    cy.contains('a', '← Înapoi').click();
    cy.url().should('include', '/posts');
  });
});

describe('Editare postare proprie', () => {
  let postTitle;

  beforeEach(() => {
    postTitle = `EditPost_${ts}_${Math.random().toString(36).slice(2, 7)}`;
    // Cream postare prin API
    cy.apiLogin(USER, PASS).then(() => {
      const userData = JSON.parse(localStorage.getItem('currentUser'));
      cy.request('POST', 'http://localhost:8080/api/posts', {
        title: postTitle,
        content: 'Continut initial',
        authorId: userData.id,
      });
    });
    cy.visit('/posts');
  });

  it('afiseaza butonul Edit pe postarea proprie', () => {
    cy.contains('.post-card', postTitle).within(() => {
      cy.contains('a', 'Edit').should('be.visible');
    });
  });



  it('sterge postarea proprie', () => {
    cy.contains('.post-card', postTitle).within(() => {
      cy.contains('button', 'Șterge').click();
    });
    cy.contains(postTitle).should('not.exist');
  });
});

describe('Cautare si filtrare postari', () => {
  before(() => {
    cy.apiLogin(USER, PASS).then(() => {
      const userData = JSON.parse(localStorage.getItem('currentUser'));
      cy.request('POST', 'http://localhost:8080/api/posts', {
        title: `CautareTest_${ts}`,
        content: 'Postare pentru cautare',
        authorId: userData.id,
      });
    });
  });

  it('cauta postare dupa titlu', () => {
    cy.get('input[placeholder*="Caută"]').type(`CautareTest_${ts}`);
    cy.contains('button', 'Caută').click();
    cy.contains(`CautareTest_${ts}`).should('be.visible');
  });

  it('filtreaza postările mele', () => {
    cy.contains('button', 'Postările mele').click();
    cy.contains(`CautareTest_${ts}`).should('be.visible');
  });

  it('butonul Toate reseteaza filtrele', () => {
    cy.contains('button', 'Postările mele').click();
    cy.contains('button', 'Toate').click();
    cy.contains('h1', 'Postări').should('be.visible');
  });

  it('filtreaza dupa tag din lista de taguri', () => {
    cy.get('.tags-row').then(($row) => {
      if ($row.length > 0) {
        cy.get('.tag-chip').first().click();
        cy.get('.post-card').should('exist');
      }
    });
  });
});

describe('Detaliu postare', () => {
  before(() => {
    cy.apiLogin(USER, PASS).then(() => {
      const userData = JSON.parse(localStorage.getItem('currentUser'));
      cy.request('POST', 'http://localhost:8080/api/posts', {
        title: `DetaliiPost_${ts}`,
        content: 'Continut detaliu post',
        authorId: userData.id,
      });
    });
  });

  it('deschide detaliile postarii la click pe card', () => {
    cy.contains('.post-card', `DetaliiPost_${ts}`).click();
    cy.url().should('match', /\/posts\/\d+/);
    cy.contains(`DetaliiPost_${ts}`).should('be.visible');
  });

  it('afiseaza sectiunea comentarii', () => {
    cy.contains('.post-card', `DetaliiPost_${ts}`).click();
    cy.contains('Comentarii').should('be.visible');
  });

  it('afiseaza butonul Înapoi la postări', () => {
    cy.contains('.post-card', `DetaliiPost_${ts}`).click();
    cy.contains('← Înapoi la postări').should('be.visible');
  });

  it('butonul Înapoi revine la lista', () => {
    cy.contains('.post-card', `DetaliiPost_${ts}`).click();
    cy.contains('← Înapoi la postări').click();
    cy.url().should('include', '/posts');
  });
});
