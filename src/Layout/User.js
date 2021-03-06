import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';

import { Dropdown } from 'semantic-ui-react';

import * as userActions from 'ducks/user';
import { openModal } from 'ducks/ban';

import SignInModal from 'components/SignInModal';
import SignUpModal from 'components/SignUpModal';
import EditUserModal from 'components/EditUserModal';
import BanModal from 'components/BanModal';

const TITLE = 'User';

const Anonymous = ({ modal, launchSignInForm, launchSignUpForm, closeForm }) =>
  <Dropdown item text={TITLE}>
    <Dropdown.Menu>
      <SignInModal
        trigger={<Dropdown.Item as="a" onClick={launchSignInForm}>Sign In</Dropdown.Item>}
        open={modal === 'signin'}
        handleClose={closeForm}
      />
      <SignUpModal
        trigger={<Dropdown.Item as="a" onClick={launchSignUpForm}>Sign Up</Dropdown.Item>}
        open={modal === 'signup'}
        handleClose={closeForm}
      />
    </Dropdown.Menu>
  </Dropdown>;

Anonymous.propTypes = {
  modal: PropTypes.any.isRequired,
  launchSignInForm: PropTypes.func.isRequired,
  launchSignUpForm: PropTypes.func.isRequired,
  closeForm: PropTypes.func.isRequired,
};

const Signed = ({ user, modal, signOut, launchEditForm, launchBanForm, closeForm, openModal }) =>
  <Dropdown item text={user.name}>
    <Dropdown.Menu>
      <EditUserModal
        trigger={<Dropdown.Item as="a" onClick={launchEditForm}>Edit profile</Dropdown.Item>}
        user={user}
        open={modal === 'edit'}
        handleClose={closeForm}
      />

      <Dropdown.Item as={Link} to="/files">My files</Dropdown.Item>
      <Dropdown.Item as={Link} to="/grants">Grants</Dropdown.Item>
      <Dropdown.Item as={Link} to="/requests">Requests</Dropdown.Item>
      <Dropdown.Item as="a" onClick={signOut}>Sign out</Dropdown.Item>


      {user.id == 1 && (
        <Dropdown.Item onClick={openModal}>User account activation/deactivation</Dropdown.Item>
      )}
    </Dropdown.Menu>
  </Dropdown>;

Signed.propTypes = {
  modal: PropTypes.any.isRequired,
  user: PropTypes.object.isRequired,
  signOut: PropTypes.func.isRequired,
  launchEditForm: PropTypes.func.isRequired,
  closeForm: PropTypes.func.isRequired,
};

function UserDropdown({ user, ...rest }) {
  return isEmpty(user)
    ? <Anonymous {...rest} />
    : <Signed user={user} {...rest} />;
}

UserDropdown.propTypes = {
  user: PropTypes.object.isRequired,
};

export default connect(
  state => state.user,
  {
    launchSignInForm: userActions.launchSignInForm,
    launchSignUpForm: userActions.launchSignUpForm,
    launchEditForm: userActions.launchEditForm,
    closeForm: userActions.closeForm,
    signOut: userActions.signOut,
    openModal,
  },
)(UserDropdown);
