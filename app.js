const { Configuration, OpenAIApi } = require("openai");

async function generateEmbeddings() {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY, })
    const openAi = new OpenAIApi(configuration)

    document = "Your text string goes here"
    const input = document.replace(/\n/g, ' ')

    const embeddingResponse = await openAi.createEmbedding({
        model: 'text-embedding-ada-002',
        input,
    })

    console.log(embeddingResponse.data.data)
}


(async () => {
    try {
        await generateEmbeddings()
    } catch (e) {

        console.log(e)
        // Deal with the fact the chain failed
    }
    // `text` is not available here
})();