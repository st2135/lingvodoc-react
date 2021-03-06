import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Button, List, Input, Select } from 'semantic-ui-react';
import { head, nth, difference, isEmpty } from 'lodash';

const localesQuery = gql`
  query Locales {
    all_locales
  }
`;

export class Translation extends React.Component {
  constructor(props) {
    super(props);
    const { translation } = props;
    this.state = {
      id: translation.id,
      localeId: translation.localeId,
      content: translation.content,
    };
    this.onChangeContent = this.onChangeContent.bind(this);
    this.onChangeLocale = this.onChangeLocale.bind(this);
  }

  onChangeContent(event, data) {
    const { onChange } = this.props;
    this.setState({ content: data.value }, () => onChange(this.state));
  }

  onChangeLocale(event, data) {
    const { locales } = this.props;
    const { onChange } = this.props;
    const locale = locales.find(l => l.shortcut === data.value);
    if (locale) {
      this.setState({ localeId: locale.id }, () => onChange(this.state));
    }
  }

  render() {
    const { locales, usedLocaleIds } = this.props;

    const options = locales
      .filter(locale => usedLocaleIds.indexOf(locale.id) < 0 || locale.id === this.state.localeId)
      .map(locale => ({ key: locale.shortcut, text: locale.intl_name, value: locale.shortcut }));

    const selectedLocale = locales.find(locale => locale.id === this.state.localeId);

    return (
      <Input placeholder="" value={this.state.content} onChange={this.onChangeContent} action>
        <input />
        <Select value={selectedLocale.shortcut} options={options} onChange={this.onChangeLocale} />
      </Input>
    );
  }
}

Translation.propTypes = {
  locales: PropTypes.array.isRequired,
  usedLocaleIds: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  translation: PropTypes.object.isRequired,
};


class Translations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      translations: [],
    };
    this.addTranslation = this.addTranslation.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    if (this.props.translations.length > 0) {
      this.setState({
        translations: this.props.translations,
      });
    }
  }
  
  onChange(translation) {
    const updateState = this.state.translations.map((t) => {
      if (t.id === translation.id) {
        return {
          ...t,
          localeId: translation.localeId,
          content: translation.content,
        };
      }
      return t;
    });

    this.setState(
      {
        translations: updateState,
      },
      () => this.props.onChange(this.state.translations)
    );
  }

  addTranslation() {
    const { data: { error, loading, all_locales: locales } } = this.props;
    if (!loading && !error) {
      const lastId = nth(this.state.translations.map(t => t.id), -1) + 1 || 1;
      // pick next free locale id
      const ids = locales.map(locale => locale.id);
      const usedIds = this.state.translations.map(t => t.localeId);
      const freeLocales = difference(ids, usedIds);
      if (!isEmpty(freeLocales)) {
        this.setState(
          {
            translations: [...this.state.translations, { id: lastId, localeId: head(freeLocales), content: '' }],
          },
          () => this.props.onChange(this.state.translations)
        );
      } else {
        window.logger.err('No more locales!');
      }
    }
  }

  render() {
    const { data: { error, loading, all_locales: locales } } = this.props;
    if (loading || error) {
      return null;
    }
    const { translations } = this.state;
    const usedLocaleIds = translations.map(t => t.localeId);
    return (
      <div>
        <List>
          {translations.map(translation => (
            <List.Item key={translation.id}>
              <Translation
                locales={locales}
                translation={translation}
                usedLocaleIds={usedLocaleIds}
                onChange={this.onChange}
              />
            </List.Item>
          ))}
        </List>
        <Button basic onClick={this.addTranslation} icon="plus" content="add" />
      </div>
    );
  }
}

Translations.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    all_locales: PropTypes.array,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  translations: PropTypes.array,
};

Translations.defaultProps = {
  translations: [],
};

export default compose(graphql(localesQuery))(Translations);
