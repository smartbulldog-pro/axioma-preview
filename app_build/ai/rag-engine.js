/**
 * АКСИОМА — Offline RAG Engine
 * TF-IDF keyword matching + cosine similarity for FAQ search
 * Zero dependencies. Works fully offline in the browser.
 */
var AxiomaRAG = (function () {
  'use strict';

  var _corpus = [];    // { id, pageId, question, answer, keywords, tokens }
  var _idf = {};       // term → IDF score
  var _ready = false;

  /** Tokenize Russian text: lowercase, remove punctuation, split */
  function tokenize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^\wа-яёa-z0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter(function (t) { return t.length > 2; });
  }

  /** Compute term frequency map */
  function tf(tokens) {
    var freq = {};
    tokens.forEach(function (t) { freq[t] = (freq[t] || 0) + 1; });
    var max = Math.max.apply(null, Object.values(freq).concat([1]));
    var result = {};
    for (var k in freq) result[k] = freq[k] / max;
    return result;
  }

  /** Build IDF from corpus */
  function buildIDF() {
    var N = _corpus.length;
    var docFreq = {};
    _corpus.forEach(function (doc) {
      var seen = {};
      doc.tokens.forEach(function (t) {
        if (!seen[t]) { docFreq[t] = (docFreq[t] || 0) + 1; seen[t] = true; }
      });
    });
    for (var t in docFreq) {
      _idf[t] = Math.log(N / (1 + docFreq[t]));
    }
  }

  /** Compute TF-IDF vector */
  function tfidfVector(tokens) {
    var tfMap = tf(tokens);
    var vec = {};
    for (var t in tfMap) {
      vec[t] = tfMap[t] * (_idf[t] || 0);
    }
    return vec;
  }

  /** Cosine similarity between two sparse vectors */
  function cosine(a, b) {
    var dot = 0, magA = 0, magB = 0;
    for (var k in a) { if (b[k]) dot += a[k] * b[k]; magA += a[k] * a[k]; }
    for (var k2 in b) { magB += b[k2] * b[k2]; }
    return (magA && magB) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
  }

  return {
    /** Initialize corpus from knowledge-base pages array */
    init: function (pages) {
      _corpus = [];
      pages.forEach(function (page) {
        (page.faq || []).forEach(function (item) {
          var combined = (item.question || '') + ' ' + (item.answer || '') + ' ' + (item.keywords || []).join(' ');
          var tokens = tokenize(combined);
          _corpus.push({
            id: item.id,
            pageId: page.pageId,
            question: item.question,
            answer: item.answer,
            tokens: tokens
          });
        });
      });
      buildIDF();
      // Pre-compute doc vectors
      _corpus.forEach(function (doc) {
        doc.vector = tfidfVector(doc.tokens);
      });
      _ready = true;
    },

    /** Search for top-k results. Boosts results matching currentPageId. */
    search: function (query, currentPageId, topK) {
      if (!_ready || !query) return [];
      topK = topK || 3;
      var qTokens = tokenize(query);
      var qVec = tfidfVector(qTokens);

      var scored = _corpus.map(function (doc) {
        var sim = cosine(qVec, doc.vector);
        // Boost same-page results by 30%
        if (doc.pageId === currentPageId) sim *= 1.3;
        return { doc: doc, score: sim };
      });

      scored.sort(function (a, b) { return b.score - a.score; });
      return scored.slice(0, topK).filter(function (s) { return s.score > 0.01; });
    },

    isReady: function () { return _ready; }
  };
})();
