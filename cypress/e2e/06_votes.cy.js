// cypress/e2e/06_votes.cy.js
// Teste pentru butoanele de vot (up/down) pe postari si comentarii

const ts = Date.now();
const USER = `voteUser_${ts}`;
const EMAIL = `${USER}@test.com`;
const PASS = 'parola123';
const OTHER = `voteOther_${ts}`;
const OTHER_EMAIL = `${OTHER}@test.com`;

let postId;
let otherId;

before(() => {
  cy.apiRegister(USER, EMAIL, PASS);
  cy.apiRegister(OTHER, OTHER_EMAIL, PASS);

  cy.request('POST', 'http://localhost:8080/api/auth/login', { username: OTHER, password: PASS })
    .then((resp) => {
      otherId = resp.body.id;
      return cy.request('POST', 'http://localhost:8080/api/posts', {
        title: `VotePost_${ts}`,
        content: 'Postare pentru teste vot',
        authorId: otherId,
      });
    })
    .then((resp) => {
      postId = resp.body.id;
      // Adaugam si un comentariu
      return cy.request('POST', `http://localhost:8080/api/posts/${postId}/comments`, {
        authorId: otherId,
        content: `ComVote_${ts}`,
      });
    });
});

beforeEach(() => {
  cy.apiLogin(USER, PASS);
  cy.visit('/posts');
});

describe('Vot pe postare din lista', () => {
  it('afiseaza butoanele de vot ▲ si ▼ pe carduri', () => {
    cy.contains('.post-card', `VotePost_${ts}`).within(() => {
      cy.contains('button', '▲').should('be.visible');
      cy.contains('button', '▼').should('be.visible');
    });
  });

  it('afiseaza numarul de voturi', () => {
    cy.contains('.post-card', `VotePost_${ts}`).within(() => {
      cy.get('.vote-count').should('exist');
    });
  });

  it('apasa vot UP pe postare din lista', () => {
    cy.contains('.post-card', `VotePost_${ts}`).within(() => {
      cy.contains('button', '▲').click();
      cy.contains('button', '▲').should('have.class', 'voted');
    });
  });

  it('apasa vot DOWN pe postare din lista', () => {
    cy.contains('.post-card', `VotePost_${ts}`).within(() => {
      cy.contains('button', '▼').click();
      cy.contains('button', '▼').should('have.class', 'voted');
    });
  });
});

describe('Vot pe postare din detaliu', () => {
  beforeEach(() => {
    cy.visit(`/posts/${postId}`);
  });

  it('apasa Dislike pe postare', () => {
    cy.contains('button', '▼ Dislike').click();
    cy.contains('button', '▼ Dislike').should('have.class', 'voted');
  });
});

describe('Vot pe comentariu', () => {
  beforeEach(() => {
    cy.visit(`/posts/${postId}`);
  });

  it('afiseaza butoanele de vot pe comentariu', () => {
    cy.contains('.comment-card', `ComVote_${ts}`).within(() => {
      cy.get('.vote-btn.up').should('exist');
      cy.get('.vote-btn.down').should('exist');
    });
  });

  it('voteaza UP pe comentariu', () => {
    cy.contains('.comment-card', `ComVote_${ts}`).within(() => {
      cy.get('.vote-btn.up').click();
      cy.get('.vote-btn.up').should('have.class', 'voted');
    });
  });
});
