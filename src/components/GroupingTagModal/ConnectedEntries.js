import React from 'react';
import PropTypes from 'prop-types';
import { compose, pure } from 'recompose';
import { graphql } from 'react-apollo';
import { connectedQuery } from './graphql';
import Tree from './Tree';
import buildPartialLanguageTree from './partialTree';

const ConnectedLexicalEntries = (props) => {
  const {
    data: { loading, error, connected_words: connectedWords },
    allLanguages,
    allDictionaries,
    allPerspectives,
    mode,
  } = props;

  if (error || loading) {
    return null;
  }

  const { lexical_entries: lexicalEntries } = connectedWords;

  if (lexicalEntries.length === 0) {
    return <span>No entries</span>;
  }

  const resultsTree = buildPartialLanguageTree({
    lexicalEntries,
    allLanguages,
    allDictionaries,
    allPerspectives,
  });

  return <Tree resultsTree={resultsTree} mode={mode} />;
};

ConnectedLexicalEntries.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    connected_words: PropTypes.object,
  }).isRequired,
  allLanguages: PropTypes.array.isRequired,
  allDictionaries: PropTypes.array.isRequired,
  allPerspectives: PropTypes.array.isRequired,
};

export default compose(graphql(connectedQuery), pure)(ConnectedLexicalEntries);
