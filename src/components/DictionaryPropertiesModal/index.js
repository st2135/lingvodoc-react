import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { branch, compose, onlyUpdateForKeys, renderNothing } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import TranslationGist from 'components/TranslationGist';
import Languages from 'components/Languages';
import gql from 'graphql-tag';
import { connect } from 'react-redux';
import { Button, Dropdown, Modal, Input, Segment, Grid, Container, Label } from 'semantic-ui-react';
import { closeDictionaryPropertiesModal } from 'ducks/dictionaryProperties';
import { isEqual } from 'lodash';
import { compositeIdToString } from 'utils/compositeId';
import Map from './Map';

const query = gql`
  query dictionaryProps($id: LingvodocID!) {
    dictionary(id: $id) {
      id
      parent_id
      translation_gist_id
      additional_metadata {
        authors
        location
        blobs
        tag_list
      }
    }
    user_blobs {
      id
      name
      data_type
      content
      created_at
      marked_for_deletion
    }
  }
`;

const getParentLanguageQuery = gql`
  query getParentLanguage($id: LingvodocID!) {
    language(id: $id) {
      id
      translation
    }
  }
`;

const updateParentMutation = gql`
  mutation updateParentLanguage($id: LingvodocID!, $parent_id: LingvodocID!) {
    update_dictionary(id: $id, parent_id: $parent_id) {
      triumph
    }
  }
`;

const updateMetadataMutation = gql`
  mutation UpdateMetadata($id: LingvodocID!, $meta: ObjectVal!) {
    update_dictionary(id: $id, additional_metadata: $meta) {
      triumph
    }
  }
`;

class Properties extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      authors: '',
      location: null,
      tags: '',
      files: [],
      parent: null,
      selectedParent: null,
    };

    this.onChangeAuthors = this.onChangeAuthors.bind(this);
    this.onSaveAuthors = this.onSaveAuthors.bind(this);
    this.onChangeLocation = this.onChangeLocation.bind(this);
    this.onSaveLocation = this.onSaveLocation.bind(this);
    this.onChangeTags = this.onChangeTags.bind(this);
    this.onSaveTags = this.onSaveTags.bind(this);
    this.onChangeFiles = this.onChangeFiles.bind(this);
    this.onSaveFiles = this.onSaveFiles.bind(this);
    this.saveMeta = this.saveMeta.bind(this);
    this.onSelectParentLanguage = this.onSelectParentLanguage.bind(this);
    this.onUpdateParentLanguage = this.onUpdateParentLanguage.bind(this);
  }

  componentWillReceiveProps(props) {
    const { data: { error, loading, dictionary } } = props;
    if (!(loading && error)) {
      const {
        additional_metadata: {
          authors, location, tag_list: tagList, blobs,
        },
      } = dictionary;

      if (authors !== this.state.authors && authors !== null) {
        this.setState({
          authors,
        });
      }
      if (location !== this.state.location) {
        this.setState({
          location,
        });
      }

      const tags = tagList.join(', ');
      if (tags !== this.state.tags) {
        this.setState({
          tags,
        });
      }

      if (!isEqual(this.state.files, blobs)) {
        this.setState({
          files: blobs.map(compositeIdToString),
        });
      }
    }
  }

  componentDidMount() {
    const { data: { error, loading, dictionary }, client } = this.props;
    if (loading || error) {
      return;
    }

    const { parent_id } = dictionary;
    if (this.state.parent == null || this.state.parent.id != parent_id) {
      client.query({
        query: getParentLanguageQuery,
        variables: { id: parent_id }
      }).then(result => {
        this.setState({
          parent: result.data.language,
          selectedParent: result.data.language
        });
      });
    }
  }

  onChangeAuthors(e, { value }) {
    this.setState({
      authors: value,
    });
  }

  onSaveAuthors() {
    this.saveMeta({
      authors: this.state.authors,
    });
  }

  onChangeLocation({ lat, lng }) {
    this.setState({
      location: {
        lat,
        lng,
      },
    });
  }

  onSaveLocation() {
    this.saveMeta({
      location: this.state.location,
    });
  }

  onChangeTags(e, { value }) {
    this.setState({
      tags: value,
    });
  }

  onSaveTags() {
    const tagList = this.state.tags.split();
    this.saveMeta({
      tag_list: tagList,
    });
  }

  onChangeFiles(e, { value }) {
    this.setState({
      files: value,
    });
  }

  onSaveFiles() {
    const { data: { user_blobs: allFiles } } = this.props;
    const ids = this.state.files.map(id => allFiles.find(f => id === compositeIdToString(f.id))).map(f => f.id);
    this.saveMeta({
      blobs: ids,
    });
  }

  saveMeta(meta) {
    const { id, update } = this.props;
    update({
      variables: {
        id,
        meta,
      },
      refetchQueries: [
        {
          query,
          variables: {
            id,
          },
        },
      ],
    });
  }

  onSelectParentLanguage(parent) {
    this.setState({ selectedParent: parent });
  }

  onUpdateParentLanguage() {
    const { data: { dictionary }, client } = this.props;
    client.mutate({
      mutation: updateParentMutation,
      variables: {
        id: dictionary.id,
        parent_id: this.state.selectedParent.id
      }
    }).then(result => {
      this.props.data.refetch().then(result => {
        this.setState({ parent: this.state.selectedParent });
      });
    });
  }

  render() {
    const { data: { dictionary, user_blobs: files }, actions } = this.props;
    const { translation_gist_id: gistId } = dictionary;
    const options = files.map(file => ({ key: file.id, text: file.name, value: compositeIdToString(file.id) }));
    const parentName = this.state.parent == null ? null : this.state.parent.translation;
    const selectedParentName = this.state.selectedParent == null ? null : this.state.selectedParent.translation;

    return (
      <Modal open dimmer size="fullscreen">
        <Modal.Content>
          <Segment>
            <TranslationGist id={gistId} editable />
          </Segment>
          <Segment>
            <Grid>
              <Grid.Column width={12}>
                <Input fluid label="Authors" value={this.state.authors} onChange={this.onChangeAuthors} />
              </Grid.Column>
              <Grid.Column width={4}>
                <Button positive content="Save" onClick={this.onSaveAuthors} />
              </Grid.Column>
            </Grid>
          </Segment>

          <Segment>
            <Grid>
              <Grid.Column width={12}>
                <Input fluid label="Tags" value={this.state.tags} onChange={this.onChangeTags} />
              </Grid.Column>
              <Grid.Column width={4}>
                <Button positive content="Save" onClick={this.onSaveTags} />
              </Grid.Column>
            </Grid>
          </Segment>

          <Segment>
            <Grid>
              <Grid.Column width={12}>
                <Dropdown
                  labeled
                  label="Files"
                  placeholder="Files"
                  fluid
                  multiple
                  selection
                  search
                  options={options}
                  onChange={this.onChangeFiles}
                  value={this.state.files}
                />
              </Grid.Column>
              <Grid.Column width={4}>
                <Button positive content="Save" onClick={this.onSaveFiles} />
              </Grid.Column>
            </Grid>
          </Segment>

          <Segment>
            <Grid>
              <Grid.Column width={12}>
                <Input
                  fluid
                  label="Location"
                  value={JSON.stringify(this.state.location)}
                  disabled
                  onChange={() => {}}
                />
              </Grid.Column>
              <Grid.Column width={4}>
                <Button positive content="Save" onClick={this.onSaveLocation} />
              </Grid.Column>
            </Grid>
          </Segment>
          <Grid>
            <Grid.Column width={8}>
              <div style={{ height: '400px' }}>
                <Container>
                  <Label size="large">Parent language: {selectedParentName || parentName}</Label>
                  <Button size="medium" disabled={selectedParentName == parentName} onClick={this.onUpdateParentLanguage}>Update</Button>
                </Container>
                <Languages height='95%' onSelect={this.onSelectParentLanguage}/>
              </div>
            </Grid.Column>
            <Grid.Column width={8}>
              <Map location={this.state.location} authors={this.state.authors} onChange={this.onChangeLocation} />
            </Grid.Column>
          </Grid>
        </Modal.Content>
        <Modal.Actions>
          <Button icon="minus" content="Close" onClick={actions.closeDictionaryPropertiesModal} />
        </Modal.Actions>
      </Modal>
    );
  }
}

Properties.propTypes = {
  id: PropTypes.array.isRequired,
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
  }).isRequired,
  update: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    closeDictionaryPropertiesModal: PropTypes.func.isRequired,
  }).isRequired,
};

export default compose(
  connect(
    state => state.dictionaryProperties,
    dispatch => ({ actions: bindActionCreators({ closeDictionaryPropertiesModal }, dispatch) })
  ),
  branch(({ id }) => !id, renderNothing),
  graphql(query),
  graphql(updateMetadataMutation, { name: 'update' }),
  branch(({ data: { loading, error } }) => loading || !!error, renderNothing),
  onlyUpdateForKeys(['id', 'data']),
  withApollo,
)(Properties);
