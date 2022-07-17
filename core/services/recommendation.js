const _ = require('underscore');
const Vector = require('vector-object');
const striptags = require('striptags');
const sw = require('stopword');
const natural = require('natural');

const { TfIdf, PorterStemmer, NGrams } = natural;
const tokenizer = new natural.WordTokenizer();

const defaultOptions = {
  maxVectorSize: 100,
  maxSimilarDocuments: 10,
  minScore: 0.01,
};

const getTokensFromString = (string) => {
  // remove html and to lower case
  const tmpString = striptags(string, [], ' ').toLowerCase();
  // tokenize the string: string[]
  const tokens = tokenizer.tokenize(tmpString);
  // get unigrams: 
  // remove stop word: remove "what"/"a"/"for"...
  // stem: "walked" -> "walk"
  const unigrams = sw
    .removeStopwords(tokens)
    .map((unigram) => PorterStemmer.stem(unigram));
  // get bigrams:
  const bigrams = NGrams.bigrams(tokens)
    .filter(
      (bigram) =>
        // filter terms with stopword
        bigram.length === sw.removeStopwords(bigram).length
    )
    .map((bigram) =>
      // stem the tokens
      bigram.map((token) => PorterStemmer.stem(token)).join('_')
    );
  // get trigrams
  const trigrams = NGrams.trigrams(tokens)
    .filter(
      (trigram) =>
        // filter terms with stopword
        trigram.length === sw.removeStopwords(trigram).length
    )
    .map((trigram) =>
      // stem the tokens
      trigram.map((token) => PorterStemmer.stem(token)).join('_')
    );

  return [].concat(unigrams, bigrams, trigrams);
}

const recommendQuestions = (questions, questionId) => {
  
  // STEP 1: format data -> tokens: string[]
  const processedDocuments = questions.map((item) => {
    let tokens = getTokensFromString(item.title);
    return {
      id: item._id.toString(),
      tokens,
      ...item,
    };
  });

  // STEP 2: create document vectors -> string[] -> vector
  const tfidf = new TfIdf();
  processedDocuments.forEach((processedDocument) => {
    tfidf.addDocument(processedDocument.tokens);
  });

  // create word vector
  const documentVectors = [];
  for (let i = 0; i < processedDocuments.length; i += 1) {
    const processedDocument = processedDocuments[i];
    const hash = {};
    const items = tfidf.listTerms(i);
    // tfidf return an array of objects containing term, the TD, IDF and TD-IDF
    const maxSize = Math.min(defaultOptions.maxVectorSize, items.length);
    for (let j = 0; j < maxSize; j += 1) {
      const item = items[j];
      hash[item.term] = item.tfidf;
    }
    const documentVector = {
      id: processedDocument.id,
      vector: new Vector(hash),
      ...processedDocument,
    };
    documentVectors.push(documentVector);
  }
    
  // STEP 3: calculate the cosine similarity
  let result = [];
  const currentQuestionVector = documentVectors.find(item => item.id === questionId);

  for (let i = 0; i < documentVectors.length; i += 1) {
    const similarity = documentVectors[i].vector.getCosineSimilarity(currentQuestionVector.vector);
    if (similarity > defaultOptions.minScore && documentVectors[i]._doc._id.toString() !== questionId) {
      result.push({ score: similarity, ...documentVectors[i]._doc });
    }    
  }

  // STEP 4: order the result
  result.sort((a, b) => b.score - a.score);
  const recommendationQuestions = result.splice(0, 10);
  
  return recommendationQuestions;
}

module.exports = { recommendQuestions };