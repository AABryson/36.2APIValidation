process.env.NODE_ENV = "test";
const request = require('supertest')
const app = require('../app')
const db = require('../db')

beforeEach(async () => {
    let result = await db.query(
    `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) VALUES ('123456789', 'http://amazon.com', 'anonymous', 'English', 123, 'Oxford', 'Generic', 2024) RETURNING title`
    )
})

afterEach(async () => {
    await db.query(
        `DELETE FROM books`
    )

})

afterAll(async () => {
    await db.end()
});

test('Get a list of books', async () => {
    let result = await request(app).get('/books')
    expect(result.body.books).toEqual([{"amazon_url": "http://amazon.com", "author": "anonymous", "isbn": "123456789", "language": "English", "pages": 123, "publisher": "Oxford", "title": "Generic", "year": 2024}])
})

test('Get a specific book', async () => {
    let result = await request(app).get("/books/123456789");
    expect(result.body.book.isbn).toEqual('123456789')
})

test('Send non-existing isbn', async () => {
    let result = await request(app).get("/books/'145'");
    expect(result.body.message).toEqual("There is no book with an isbn '145'")
})

test('Create new book', async() => {
    let result = await request(app).post('/books')
    .send({
        isbn: '123',
        amazon_url: "http://amazon.com",
        author: "moi",
        language: "English",
        pages: 1234,
        publisher: "Princeton",
        title: "Generic",
        year: 2023})
    expect(result.status).toEqual(201);
    expect(result.body.book).toHaveProperty("title")
})

test('Invalid input', async () => {
    let result = (await request(app).post('/books').send({
        isbn: '123',
        amazon_url: "http://amazon.com",
        author: "moi",
        language: "English",
        pages: "1234",
        publisher: "Princeton",
        title: "Generic",
    })
    );
    expect(result.status).toEqual(400)
})


test('Update a book', async () => {
    let result = await request(app).put("/books/123456789").send(
        {amazon_url: "http://amazon.com/test",
        author: "new moi",
        language: "English",
        pages: 12345,
        publisher: "Yale",
        title: "Generic",
        year: 2023});
    console.log(result.body.book)
    expect(result.body.book).toEqual({amazon_url: "http://amazon.com/test",
    author: "new moi",
    isbn: "123456789",
    language: "English",
    pages: 12345,
    publisher: "Yale",
    title: "Generic",
    year: 2023})
})