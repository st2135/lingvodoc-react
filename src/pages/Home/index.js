import React from 'react';
import PropTypes from 'prop-types';
import { compose, withReducer } from 'recompose';
import { graphql, gql } from 'react-apollo';
import Immutable, { fromJS, List, Map, Set } from 'immutable';
import { Link } from 'react-router-dom';
import { Container, Dropdown, Button, Checkbox } from 'semantic-ui-react';

import LanguageTree from 'components/Tree';
import { buildLanguageTree, assignDictsToTree } from 'pages/Search/treeBuilder';

import './published.scss';

const q = gql`
  query DictionaryWithPerspectives {
    dictionaries {
      id
      parent_id
      translation
      additional_metadata {
        authors
      }
      perspectives {
        id
        translation
      }
    }
    grants {
      id
      translation
      additional_metadata {
        participant
      }
    }
    language_tree {
      id
      parent_id
      translation
      created_at
    }
  }
`;

function toId(arr, prefix = null) {
  const joiner = prefix ? arr[prefix] : arr;
  return joiner.join('/');
}

const Perspective = ({ parent: pid, perspective: p }) => (
  <Dropdown.Item as={Link} to={`dictionary/${toId(pid)}/perspective/${toId(p.id)}`}>
    {p.translation}
  </Dropdown.Item>
);

const Dictionary = ({
  id, selected, translation, additional_metadata: meta, perspectives, onSelect,
}) => (
  <div className={`dict ${selected ? 'selected' : ''}`}>
    <span className="dict-name" onClick={() => onSelect(id)}>
      {translation}
    </span>
    <span className="dict-authors">{(meta && meta.authors) || '.'}</span>
    <Dropdown className="dict-perspectives" inline text={`View (${perspectives.length})`}>
      <Dropdown.Menu>
        {perspectives.map(pers => <Perspective key={toId(pers.id)} parent={id} perspective={pers} />)}
      </Dropdown.Menu>
    </Dropdown>
  </div>
);

function generateNodeProps(onSelect) {
  return ({ node, path }) => {
    switch (node.type) {
      case 'language':
        return {
          title: node.translation,
        };
      default:
        return {
          className: node.selected ? 'selected' : '',
          title: <Dictionary {...node} onSelect={onSelect} />,
        };
    }
  };
}

function restDictionaries(dicts, grants) {
  const grantedDicts = grants
    .flatMap(grant => grant.getIn(['additional_metadata', 'participant']) || new List())
    .toSet();
  return dicts.reduce((acc, dict, id) => (grantedDicts.has(id) ? acc : acc.push(dict)), new List());
}

function GrantedTree({ tree, onSelect }) {
  if (tree.size === 0) {
    return <div>Empty</div>;
  }
  return <LanguageTree expanded data={tree} generateNodeProps={generateNodeProps(onSelect)} />;
}

function selectedReducer(state, { type, payload }) {
  const id = fromJS(payload);
  switch (type) {
    case 'TOGGLE_DICT':
      return state.has(id) ? state.delete(id) : state.add(id);
    case 'RESET_DICTS':
      return state.deleteAll();
    default:
      return state;
  }
}

function modeReducer(state = false, { type, payload }) {
  switch (type) {
    case 'TOGGLE_GRANTS_MODE':
      return !state;
    case 'SET_GRANTS_MODE':
      return payload;
    default:
      return state;
  }
}

function GrantedDicts(props) {
  const {
    data: {
      loading, error, dictionaries, grants, language_tree: allLanguages,
    },
    selected,
    grantsMode,
    dispatch,
    dispatchMode,
    downloadDictionaries,
  } = props;
  if (loading || error) {
    return null;
  }

  const languages = Immutable.fromJS(allLanguages);
  const languagesTree = buildLanguageTree(languages);

  const dicts = fromJS(dictionaries)
    .reduce((acc, dict) => acc.set(dict.get('id'), dict), new Map())
    .map((d, id) => d.set('selected', selected.get(id)));

  const trees = fromJS(grants).map((grant) => {
    const dictIds = grant.getIn(['additional_metadata', 'participant']) || new List();
    const pickedDicts = dictIds.map(id => dicts.get(id));
    return {
      id: grant.get('id'),
      text: grant.get('translation'),
      tree: assignDictsToTree(pickedDicts, languagesTree),
    };
  });

  const restTree = grantsMode
    ? assignDictsToTree(restDictionaries(dicts, fromJS(grants)), languagesTree)
    : assignDictsToTree(fromJS(dictionaries), languagesTree);

  function onSelect(payload) {
    dispatch({ type: 'TOGGLE_DICT', payload });
  }

  function download() {
    const ids = selected.toJS();
    downloadDictionaries({
      variables: { ids },
    }).then(() => {
      dispatch({ type: 'RESET_DICTS' });
    });
  }

  function changeMode(m) {
    dispatchMode({ type: 'SET_GRANTS_MODE', payload: m });
  }

  return (
    <Container className="published">
      <Checkbox toggle defaultChecked={grantsMode} onChange={(e, v) => changeMode(v.checked)} />
      {grantsMode &&
        trees.map(({ id, text, tree }) => (
          <div key={id} className="grant">
            <div className="grant-title">{text}</div>
            <GrantedTree tree={tree} onSelect={onSelect} />
          </div>
        ))}
      <div className="grant">
        {grantsMode && <div className="grant-title">Индивидуальная работа</div>}
        <GrantedTree tree={restTree} onSelect={onSelect} />
      </div>
    </Container>
  );
}

export default compose(
  withReducer('selected', 'dispatch', selectedReducer, new Set()),
  withReducer('grantsMode', 'dispatchMode', modeReducer, true),
  graphql(q),
)(GrantedDicts);
