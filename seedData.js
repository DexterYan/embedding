const { Sequelize, DataTypes, Model } = require('sequelize');
const pgvector = require('pgvector/sequelize');
const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs/promises');

pgvector.registerType(Sequelize);

class Item extends Model { }

let sequelize;

function connect() {
    return new Sequelize('postgres://localhost/pgvector_node_test', {
        logging: false
    });
}

async function generateEmbeddings() {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY, })
    const openAi = new OpenAIApi(configuration)

    document = "Your text string goes here"
    const input = document.replace(/\n/g, ' ')

    const embeddingResponse = await openAi.createEmbedding({
        model: 'text-embedding-ada-002',
        input,
    })

    return embeddingResponse.data.data[0].embedding
}

async function createItems() {
    const documents = await fs.readFile('./knowledge/documents.json');
    const documentsJson = JSON.parse(documents);
    vectors = []
    i = 0
    for (const document of documentsJson) {
        i += 1
        factors = await generateEmbeddings(document)
        await Item.create({ id: i, factors, content: document.content, title: document.title });
        vectors.push({
            "title": document.title,
            "factor": factors,
        })
    }

    return vectors
}

(async () => {
    try {
        sequelize = connect();
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector');
        sequelize.close();
        sequelize = connect();

        Item.init({
            factors: {
                type: DataTypes.VECTOR(1536)
            },
            content: {
                type: DataTypes.TEXT
            },
            title: {
                type: DataTypes.TEXT
            },
        }, {
            sequelize,
            modelName: 'Item'
        });

        await Item.sync({ force: true });

        vectors = await createItems();

        sequelize.close();
    } catch (e) {
        console.log(e)
    }
})();