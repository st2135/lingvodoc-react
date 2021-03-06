import React from 'react';
import PropTypes from 'prop-types';
import { compose, branch, renderNothing } from 'recompose';
import { isEqual } from 'lodash';
import { graphql } from 'react-apollo';
import { Button, List, Dropdown, Grid, Checkbox } from 'semantic-ui-react';
import { compositeIdToString } from 'utils/compositeId';
import { uuidv4 as uuid } from 'utils/uuid';

import { allFieldsQuery } from './graphql';

const NestedColumn = ({
  column, columns, fields, onChange,
}) => {
  const nested = columns.find(({ self_id: s }) => column.id === s);

  const options = columns.filter(c => !isEqual(c.id, column.id)).map((c) => {
    const field = fields.find(f => isEqual(f.id, c.field_id));
    return { text: field.translation, value: c.id };
  });

  return (
    <Dropdown
      selection
      options={options}
      onChange={(a, { value }) => onChange(value, nested ? nested.id : null)}
    />
  );
};

NestedColumn.propTypes = {
  column: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  fields: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};

class Column extends React.Component {
  constructor(props) {
    super(props);
    const { column, columns } = props;
    this.state = {
      ...column,
      hasNestedField: !!columns.find(({ self_id: s }) => isEqual(column.id, s)),
    };
    this.onFieldChange = this.onFieldChange.bind(this);
    this.onLinkChange = this.onLinkChange.bind(this);
    this.onNestedChange = this.onNestedChange.bind(this);
  }

  onFieldChange(value) {
    const { fields, onChange } = this.props;
    const field = fields.find(f => compositeIdToString(f.id) === value);
    if (field) {
      this.setState(
        {
          field_id: field.id,
        },
        () => onChange(this.state)
      );
    }
  }

  onLinkChange(value) {
    const { onChange } = this.props;
    this.setState(
      {
        link_id: value,
      },
      () => onChange(this.state)
    );
  }

  onNestedChange(newNested, oldNested) {

    const { onChange, column, columns } = this.props;
    const nestedColumn = columns.find(c => c.id === newNested);
    if (nestedColumn) {
      nestedColumn.self_id = column.id;
      onChange(nestedColumn);

      // remove self_id from old column
      if (oldNested) {
        const oldColumn = columns.find(c => c.id === oldNested);
        oldColumn.self_id = null;
        onChange(oldColumn);
      }
    }
  }

  render() {
    const {
      column, columns, fields, perspectives,
    } = this.props;

    const field = fields.find(f => isEqual(f.id, column.field_id));
    const options = fields.map(f => ({ text: f.translation, value: compositeIdToString(f.id) }));
    const availablePerspectives = perspectives.map(p => ({ text: p.index, value: p.index }));
    const currentField = compositeIdToString(field.id);

    return (
      <span>
        <Dropdown
          selection
          defaultValue={currentField}
          options={options}
          onChange={(a, { value }) => this.onFieldChange(value)}
        />
        {field &&
          field.data_type === 'Link' && (
            <Dropdown selection options={availablePerspectives} onChange={(a, { value }) => this.onLinkChange(value)} />
          )}
        {field &&
          field.data_type !== 'Link' &&
          field.data_type !== 'Directed Link' &&
          field.data_type !== 'Grouping Tag' && (
            <Checkbox
              defaultChecked={this.state.hasNestedField}
              onChange={(e, { checked }) => this.setState({ hasNestedField: checked })}
              label="has linked field"
            />
          )}
        {this.state.hasNestedField && (
          <NestedColumn column={column} columns={columns} fields={fields} onChange={this.onNestedChange} />
        )}
      </span>
    );
  }
}

Column.propTypes = {
  column: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
  perspectives: PropTypes.array.isRequired,
  fields: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};

class Columns extends React.Component {
  constructor(props) {
    super(props);
    this.onChangePos = this.onChangePos.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onRemove = this.onRemove.bind(this);
    this.onChangeColumn = this.onChangeColumn.bind(this);

    this.state = {
      columns: [],
    };
  }

  onChangePos(column, direction) {
    const { columns } = this.state;
    const { onChange } = this.props;
    const index = columns.findIndex(c => c.id === column.id);
    const swap = (i1, i2) => {
      const c = columns.slice(0);
      const v = c[i2];
      c[i2] = c[i1];
      c[i1] = v;
      return c;
    };

    if (direction === 'up' && index > 0) {
      const newIndex = index - 1;
      this.setState({
        columns: swap(index, newIndex),
      }, onChange(this.state.columns));
    }

    if (direction === 'down' && index < columns.length - 1) {
      const newIndex = index + 1;
      this.setState({
        columns: swap(index, newIndex),
      }, onChange(this.state.columns));
    }
  }

  onCreate(field) {
    const { onChange } = this.props;
    this.setState({
      columns: [
        ...this.state.columns,
        {
          id: uuid(),
          self_id: null,
          link_id: null,
          field_id: field.id,
        },
      ],
    }, () => onChange(this.state.columns));
  }

  onRemove(column) {
    const { onChange } = this.props;
    this.setState({
      columns: this.state.columns.filter(c => c.id !== column.id),
    }, () => onChange(this.state.columns));
  }

  onChangeColumn(column) {
    const { onChange } = this.props;
    const { columns } = this.state;
    const index = columns.findIndex(c => c.id === column.id);
    columns[index] = column;
    this.setState({
      columns,
    }, () => onChange(this.state.columns));
  }

  render() {
    const { perspectives, data: { all_fields: allFields } } = this.props;
    const { columns } = this.state;
 
    return (
      <div>
        <List divided relaxed>
          {columns.filter(column => !column.self_id).map(column => (
            <List.Item key={column.id}>
              <Grid centered columns={2}>
                <Grid.Column width={11}>
                  <Column
                    column={column}
                    columns={columns}
                    fields={allFields}
                    perspectives={perspectives}
                    onChange={this.onChangeColumn}
                  />
                </Grid.Column>
                <Grid.Column width={1}>
                  <Button.Group icon>
                    <Button basic icon="caret up" onClick={() => this.onChangePos(column, 'up')} />
                    <Button basic icon="caret down" onClick={() => this.onChangePos(column, 'down')} />
                    <Button negative icon="cancel" onClick={() => this.onRemove(column)} />
                  </Button.Group>
                </Grid.Column>
              </Grid>
            </List.Item>
          ))}
        </List>

        <Button
          basic
          content="Add new column"
          onClick={() => this.onCreate(allFields.find(f => f.data_type === 'Text'))}
        />
      </div>
    );
  }
}

Columns.propTypes = {
  perspectives: PropTypes.array.isRequired,
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default compose(graphql(allFieldsQuery), branch(({ data }) => data.loading, renderNothing))(Columns);
