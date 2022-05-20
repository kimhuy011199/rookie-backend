const _ = require('underscore');
const Vector = require('vector-object');
const striptags = require('striptags');
const sw = require('stopword');
const natural = require('natural');

const { TfIdf, PorterStemmer, NGrams } = natural;
const tokenizer = new natural.WordTokenizer();

const defaultOptions = {
  maxVectorSize: 100,
  maxSimilarDocuments: Number.MAX_SAFE_INTEGER,
  minScore: 0,
};

class ContentBasedRecommendationSystem {
  constructor(options = {}) {
    this.setOptions(options);
    this.data = {};
    // options: {
    //   maxVectorSize: number,
    //   maxSimilarDocuments: number,
    //   minScore: number,
    // }
    // data: {
    //   ...document,
    //   score: number,
    // }
  }

  setOptions(options = {}) {
    // validation max vector size
    if (
      options.maxVectorSize !== undefined &&
      (!Number.isInteger(options.maxVectorSize) || options.maxVectorSize <= 0)
    ) {
      throw new Error(
        'The option maxVectorSize should be integer and greater than 0'
      );
    }
    // validation max similar documents
    if (
      options.maxSimilarDocuments !== undefined &&
      (!Number.isInteger(options.maxSimilarDocuments) ||
        options.maxSimilarDocuments <= 0)
    ) {
      throw new Error(
        'The option maxSimilarDocuments should be integer and greater than 0'
      );
    }
    // validation min score
    if (
      options.minScore !== undefined &&
      (!_.isNumber(options.minScore) ||
        options.minScore < 0 ||
        options.minScore > 1)
    ) {
      throw new Error('The option minScore should be a number between 0 and 1');
    }

    this.options = Object.assign({}, defaultOptions, options);
  }

  train(documents) {
    this.validateDocuments(documents);
    // step 1 - preprocess the documents
    const preprocessDocs = this._preprocessDocuments(documents, this.options);
    // step 2 - create document vectors
    const docVectors = this._produceWordVectors(preprocessDocs, this.options);
    // step 3 - calculate similarities
    this.data = this._calculateSimilarities(docVectors, this.options);
  }

  validateDocuments(documents) {
    // check if document is array of objects
    if (!_.isArray(documents)) {
      throw new Error('Documents should be an array of objects');
    }

    for (let i = 0; i < documents.length; i += 1) {
      const document = documents[i];
      // check if document has id and title key
      if (!_.has(document, 'id') || !_.has(document, 'title')) {
        throw new Error('Documents should be have fields id and title');
      }
      // check if document does not have tokens and vector key
      if (_.has(document, 'tokens') || _.has(document, 'vector')) {
        throw new Error(
          '"tokens" and "vector" properties are reserved and cannot be used as document properties"'
        );
      }
    }
  }

  getSimilarDocuments(id, start = 0, size = undefined) {
    // slice array start to end
    let similarDocuments = this.data[id];
    if (similarDocuments === undefined) {
      return [];
    }
    const end = size !== undefined ? start + size : undefined;
    similarDocuments = similarDocuments.slice(start, end);

    return similarDocuments;
  }

  // step 1
  _preprocessDocuments(documents, options) {
    const processedDocuments = documents.map((item) => {
      let tokens = this._getTokensFromString(item.title);
      return {
        id: item.id,
        tokens,
        ...item,
      };
    });

    return processedDocuments;
  }

  _getTokensFromString(string) {
    // remove html and to lower case
    const tmpString = striptags(string, [], ' ').toLowerCase();
    // tokenize the string
    const tokens = tokenizer.tokenize(tmpString);
    // get unigrams
    const unigrams = sw
      .removeStopwords(tokens)
      .map((unigram) => PorterStemmer.stem(unigram));
    // get bigrams
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

  // step 2
  _produceWordVectors(processedDocuments, options) {
    // process tfidf
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
      const maxSize = Math.min(options.maxVectorSize, items.length);
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

    return documentVectors;
  }

  initializeDataHash(documentVectors) {
    return documentVectors.reduce((acc, item) => {
      acc[item.id] = [];
      return acc;
    }, {});
  }

  // step 3
  _calculateSimilarities(documentVectors, options) {
    const data = { ...this.initializeDataHash(documentVectors) };

    // calculate the similar scores
    for (let i = 0; i < documentVectors.length; i += 1) {
      for (let j = 0; j < i; j += 1) {
        let documentVectorA = documentVectors[i];
        let {
          tokens: tokensA,
          vector: vectorA,
          ...documentA
        } = documentVectorA;
        const idi = documentVectorA.id;
        const vi = documentVectorA.vector;
        let documentVectorB = documentVectors[j];
        let {
          tokens: tokensB,
          vector: vectorB,
          ...documentB
        } = documentVectorB;
        const idj = documentVectorB.id;
        const vj = documentVectorB.vector;
        const similarity = vi.getCosineSimilarity(vj);

        if (similarity > options.minScore) {
          data[idi].push({
            id: documentVectorB.id,
            score: similarity,
            ...documentB,
          });
          data[idj].push({
            id: documentVectorA.id,
            score: similarity,
            ...documentA,
          });
        }
      }
    }

    this.orderDocuments(data, options);
    return data;
  }

  orderDocuments(data, options) {
    // sort the similar documents by descending order
    Object.keys(data).forEach((id) => {
      data[id].sort((a, b) => b.score - a.score);
      if (data[id].length > options.maxSimilarDocuments) {
        data[id] = data[id].slice(0, options.maxSimilarDocuments);
      }
    });
  }
}

module.exports = ContentBasedRecommendationSystem;
