import React from 'react';
import classNames from 'classnames';

const {oneOf, bool} = React.PropTypes;

class Theming extends React.Component {
  constructor(props) {
    super(props);

    this.state = { theme: 'default' };
    this.themeSelected = this.themeSelected.bind(this);
  }

  themeSelected(e) {
    this.setState({ theme: e.target.value });
  }

  render() {
    return (
      <div className={`${this.state.theme}-theme`}>
        <h2>Theming</h2>

        <p className={styles.paragraph}>
          <select value={this.state.theme} onChange={this.themeSelected}>
            <option value="default">No Theme</option>
            <option value="red">Red Theme</option>
            <option value="blue">Blue Theme</option>
          </select>

          Selecting a theme will change the color of both this text and the input.
        </p>
      </div>
    );
  }
}

const styles = cssInJS({
  paragraph: {
    fontSize: '12pt',
  },

  'paragraph select': {
    marginRight: 20,
  },

  '$.red-theme': {
    paragraph: {
      color: 'red',
    },
  },

  '$.blue-theme': {
    paragraph: {
      color: 'blue',
    },
  },
});

export default Theming;
