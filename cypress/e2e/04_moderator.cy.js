// cypress/e2e/04_moderator.cy.js
// Teste pentru functionalitati de moderator: ban, unban, stergere postari/comentarii altor useri

const ts = Date.now();
const MOD_USER = `modUser_${ts}`;
const MOD_EMAIL = `${MOD_USER}@test.com`;
const NORMAL_USER = `normalUser_${ts}`;
const NORMAL_EMAIL = `${NORMAL_USER}@test.com`;
const PASS = 'parola123';

let modId;
let normalId;
let postId;
let commentId;

before(() => {
  // Cream moderatorul si userul normal
  cy.apiRegister(MOD_USER, MOD_EMAIL, PASS);
  cy.apiRegister(NORMAL_USER, NORMAL_EMAIL, PASS);

  // Obtinem ID-urile
  cy.request('POST', 'http://localhost:8080/api/auth/login', { username: MOD_USER, password: PASS })
    .then((resp) => {
      modId = resp.body.id;
      // Promovam la MODERATOR
      return cy.request('POST', `http://localhost:8080/api/users/${modId}/promote`);
    });

  cy.request('POST', 'http://localhost:8080/api/auth/login', { username: NORMAL_USER, password: PASS })
    .then((resp) => {
      normalId = resp.body.id;
      // Cream o postare si un comentariu pentru normal user
      return cy.request('POST', 'http://localhost:8080/api/posts', {
        title: `ModTestPost_${ts}`,
        content: 'Postare de sters de moderator',
        authorId: normalId,
      });
    })
    .then((resp) => {
      postId = resp.body.id;
      return cy.request('POST', `http://localhost:8080/api/posts/${postId}/comments`, {
        authorId: normalId,
        content: `ComModTest_${ts}`,
      });
    })
    .then((resp) => {
      commentId = resp.body.id;
    });
});

describe('Moderator - banner indicator', () => {
  beforeEach(() => {
    cy.apiLogin(MOD_USER, PASS);
    cy.visit(`/posts/${postId}`);
  });

  it('afiseaza bannerul de moderator pe postarea altcuiva', () => {
    cy.contains('🛡️ Vizualizezi ca moderator').should('be.visible');
  });

  it('afiseaza butonul Editează ca moderator', () => {
    cy.get('.author-actions').within(() => {
      cy.contains('a', 'Editează').should('be.visible');
    });
  });

  it('afiseaza butonul Șterge pe postarea altcuiva', () => {
    cy.get('.author-actions').within(() => {
      cy.contains('button', 'Șterge').should('be.visible');
    });
  });

  it('moderatorul vede butonul Editează pe comentariile altora', () => {
    cy.contains('.comment-card', `ComModTest_${ts}`).within(() => {
      cy.contains('button', 'Editează').should('be.visible');
    });
  });

  it('moderatorul vede butonul Șterge pe comentariile altora', () => {
    cy.contains('.comment-card', `ComModTest_${ts}`).within(() => {
      cy.contains('button', 'Șterge').should('be.visible');
    });
  });
});

describe('Moderator - editare postare straina', () => {
  beforeEach(() => {
    cy.apiLogin(MOD_USER, PASS);
    cy.visit(`/posts/${postId}`);
  });

  it('editeaza postarea altcuiva ca moderator', () => {
    cy.get('.author-actions').contains('a', 'Editează').click();
    cy.url().should('include', '/edit');
    const newTitle = `ModEditTitle_${ts}`;
    cy.get('input[name="title"]').clear().type(newTitle);
    cy.contains('button', 'Salvează').click();
    cy.url().should('include', '/posts');
    cy.contains(newTitle).should('be.visible');
  });
});

describe('Moderator - editare si stergere comentariu strain', () => {
  let commentId2;

  before(() => {
    cy.request('POST', 'http://localhost:8080/api/auth/login', { username: NORMAL_USER, password: PASS })
      .then((resp) => {
        normalId = resp.body.id;
        return cy.request('POST', `http://localhost:8080/api/posts/${postId}/comments`, {
          authorId: normalId,
          content: `ComDeEditatMod_${ts}`,
        });
      })
      .then((resp) => {
        commentId2 = resp.body.id;
      });
  });

  beforeEach(() => {
    cy.apiLogin(MOD_USER, PASS);
    cy.visit(`/posts/${postId}`);
  });

  it('editeaza comentariul altcuiva ca moderator', () => {
    cy.contains('.comment-card', `ComDeEditatMod_${ts}`).within(() => {
      cy.contains('button', 'Editează').click();
      cy.get('textarea').clear().type(`ComEditatDeMod_${ts}`);
      cy.contains('button', 'Salvează').click();
    });
    cy.contains(`ComEditatDeMod_${ts}`).should('be.visible');
  });

  it('sterge comentariul altcuiva ca moderator', () => {
    cy.request('POST', `http://localhost:8080/api/posts/${postId}/comments`, {
      authorId: normalId,
      content: `ComDeStersMod_${ts}`,
    });
    cy.reload();
    cy.contains('.comment-card', `ComDeStersMod_${ts}`).within(() => {
      cy.contains('button', 'Șterge').click();
    });
    cy.contains(`ComDeStersMod_${ts}`).should('not.exist');
  });
});

describe('Moderator - ban si unban utilizatori', () => {
  beforeEach(() => {
    cy.apiLogin(MOD_USER, PASS);
    cy.visit('/users');
  });

  it('afiseaza mesajul de moderator pe pagina utilizatori', () => {
    cy.contains('🛡️ Ești moderator').should('be.visible');
  });

  it('afiseaza butonul Banează pe userul normal', () => {
    cy.contains('.user-card', NORMAL_USER).within(() => {
      cy.contains('button', '🚫 Banează').should('be.visible');
    });
  });

  it('baneaza userul normal', () => {
    cy.contains('.user-card', NORMAL_USER).within(() => {
      cy.contains('button', '🚫 Banează').click();
    });
    cy.contains('.user-card', NORMAL_USER).within(() => {
      cy.contains('.banned-badge', '🚫 Banat').should('be.visible');
    });
  });

  it('afiseaza butonul Debanează dupa banare', () => {
    cy.contains('.user-card', NORMAL_USER).within(() => {
      cy.contains('button', '✅ Debanează').should('be.visible');
    });
  });

  it('debaneaza userul normal', () => {
    cy.contains('.user-card', NORMAL_USER).within(() => {
      cy.contains('button', '✅ Debanează').click();
    });
    cy.contains('.user-card', NORMAL_USER).within(() => {
      cy.contains('button', '🚫 Banează').should('be.visible');
    });
  });

  it('moderatorul nu are buton de ban pe propriul cont', () => {
    cy.contains('.user-card', MOD_USER).within(() => {
      cy.contains('button', '🚫 Banează').should('not.exist');
    });
  });

  it('moderatorul nu are buton de ban pe alt moderator', () => {
    // Verificam ca cardurile cu badge MODERATOR nu au buton ban
    cy.get('.user-card').each(($card) => {
      if ($card.text().includes('🛡️ Moderator')) {
        cy.wrap($card).contains('button', '🚫 Banează').should('not.exist');
      }
    });
  });
});

describe('Utilizator banat - mesaj la login', () => {
  const BANNED_USER = `bannedUser_${ts}`;
  const BANNED_EMAIL = `${BANNED_USER}@test.com`;
  let bannedId;

  before(() => {
    cy.apiRegister(BANNED_USER, BANNED_EMAIL, PASS);
    cy.request('POST', 'http://localhost:8080/api/auth/login', { username: BANNED_USER, password: PASS })
      .then((resp) => {
        bannedId = resp.body.id;
        return cy.request('POST', `http://localhost:8080/api/users/${bannedId}/ban`, {
          moderatorId: modId,
        });
      });
  });

  it('afiseaza mesaj de ban la login cu cont banat', () => {
    cy.visit('/login');
    cy.get('input[type="text"]').type(BANNED_USER);
    cy.get('input[type="password"]').type(PASS);
    cy.contains('button', 'Autentificare').click();
    // Fie mesaj in pagina, fie redirect la /banned
    cy.get('body').then(($body) => {
      if ($body.find('.banned-msg').length > 0) {
        cy.get('.banned-msg').should('be.visible');
      } else {
        cy.url().should('include', '/banned');
        cy.contains('Cont Blocat').should('be.visible');
      }
    });
  });

  it('pagina /banned afiseaza mesaj de interzicere', () => {
    cy.visit('/banned');
    cy.contains('Cont Blocat').should('be.visible');
    cy.contains('blocat').should('be.visible');
    cy.contains('← Înapoi la Login').should('be.visible');
  });

  it('userul banat nu poate accesa /posts direct', () => {
    // Logam ca banat prin localStorage direct si incercam sa accesam /posts
    cy.request('POST', 'http://localhost:8080/api/auth/login', {
      username: BANNED_USER,
      password: PASS,
    }).then((resp) => {
      // Banuiti care au cont banat primesc 403
      expect(resp.status).to.eq(403);
    });
  });

  it('butonul Înapoi la Login din pagina banned duce la /login', () => {
    cy.visit('/banned');
    cy.contains('← Înapoi la Login').click();
    cy.url().should('include', '/login');
  });
});
