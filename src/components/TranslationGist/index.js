import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import { Container, Button, List } from 'semantic-ui-react';
import TranslationAtom from '../TranslationAtom';
import { compositeIdToString } from '../../utils/compositeId';

export const translationGistQuery = gql`
  query($id: LingvodocID!) {
    translationgist(id: $id) {
      id
      translationatoms {
        id
        parent_id
        locale_id
        content
        created_at
      }
    }
    all_locales
  }
`;

@graphql(translationGistQuery)
export default class TranslationGist extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      createdAtoms: [],
    };

    this.addAtom = this.addAtom.bind(this);
    this.onAtomCreated = this.onAtomCreated.bind(this);
  }

  onAtomCreated(id) {
    const { createdAtoms } = this.state;
    this.setState({
      createdAtoms: createdAtoms.filter(e => id !== e),
    });
  }

  addAtom = () => {
    const { createdAtoms } = this.state;
    const nextId = createdAtoms.length + 1;
    this.setState({
      createdAtoms: [nextId, ...createdAtoms],
    });
  };

  render() {
    const { data, editable } = this.props;

    if (data.loading) {
      return null;
    }

    const atoms =
      data.translationgist.translationatoms.slice().sort((a, b) => (a.created_at > b.created_at ? 1 : 0)) || [];
    const locales = data.all_locales || [];

    return (
      <Container>
        <List>
          {atoms.map(atom => (
            <List.Item key={compositeIdToString(atom.id)}>
              <TranslationAtom
                id={atom.id}
                parentId={atom.parent_id}
                localeId={atom.locale_id}
                content={atom.content}
                locales={locales}
                editable={editable}
                onSave={this.onChangeAtom}
              />
            </List.Item>
          ))}
          {this.state.createdAtoms.map(id => (
            <List.Item key={id}>
              <TranslationAtom
                parentId={data.translationgist.id}
                locales={locales}
                editable={editable}
                onAtomCreated={() => this.onAtomCreated(id)}
              />
            </List.Item>
          ))}
        </List>
        <Button onClick={this.addAtom}>Add</Button>
      </Container>
    );
  }
}

TranslationGist.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  id: PropTypes.array,
  editable: PropTypes.bool.isRequired,
  data: PropTypes.object,
};

TranslationGist.defaultProps = {
  id: [null, null],
  data: {},
};
