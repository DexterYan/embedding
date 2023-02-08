const { Sequelize, DataTypes, Model } = require('sequelize');
const pgvector = require('pgvector/sequelize');
const { Configuration, OpenAIApi } = require("openai");



pgvector.registerType(Sequelize);
class Item extends Model { }

let sequelize;

function connect() {
    return new Sequelize('postgres://localhost/pgvector_node_test', {
        logging: false
    });
}

async function generateEmbeddings(document) {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY, })
    const openAi = new OpenAIApi(configuration)

    const input = document.replace(/\n/g, ' ')

    const embeddingResponse = await openAi.createEmbedding({
        model: 'text-embedding-ada-002',
        input,
    })

    return embeddingResponse.data.data[0].embedding
}

async function answer(content, query) {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY, })
    const openai = new OpenAIApi(configuration)

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `I am a highly intelligent question answering bot. If you ask me a question that is rooted in truth, I will give you the answer. If you ask me a question that is nonsense, trickery, or has no clear answer, I will respond with \"Unknown\".\n\nContext sections:\n${content}\n\nQ: ${query}\nA:`,
        temperature: 0,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: ["\n"],
    });

    return completion.data.choices[0].text
}

(async () => {
    try {
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


        const query = "How to install kurl in Highly Available k8s cluster"
        console.log(query)
        const factors = await generateEmbeddings(query)
        // console.log(factors.toString())

        const items = await Item.findAll({
            order: [sequelize.literal(`factors <-> '[${factors.toString()}]'`)],
            limit: 5
        });


        console.log("\n======== sorted result ========\n", items.map(item => item.title));
        contents = items.map(item => item.content)
        contents = contents.toString("\n")

        const text = await answer(contents, query)
        console.log("\n======== openai result ========\n", text);
        sequelize.close();
    } catch (e) {
        console.log(e)
    }
})();