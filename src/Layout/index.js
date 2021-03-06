import 'semantic-ui-css/semantic.css';
import 'styles/main.scss';

import React from 'react';
import styled from 'styled-components';
import { Sidebar } from 'semantic-ui-react';

import PlayerModal from 'components/PlayerModal';
import MarkupModal from 'components/MarkupModal';
import GroupingTagModal from 'components/GroupingTagModal';
import LinkModal from 'components/LinkModal';
import DictionaryProperties from 'components/DictionaryPropertiesModal';
import SaveDictionary from 'components/SaveDictionaryModal';
import PerspectiveProperties from 'components/PerspectivePropertiesModal';
import PhonemicAnalysisModal from 'components/PhonemicAnalysisModal';
import PhonologyModal from 'components/PhonologyModal';
import ConverEafModal from 'components/ConverEafModal';
import StatisticsModal from 'components/StatisticsModal';
import BanModal from 'components/BanModal';
import LexicalEntryModal from 'components/LexicalEntryModal';

import NavBar from './NavBar';
import TasksSidebar from './TasksSidebar';
import Snackbar from './Snackbar';
import Routes from './Routes';

const Content = styled.div`
  padding: 5em 20px;
  height: 100vh !important;
  overflow-y: auto !important;
`;

const Layout = () => (
  <div>
    <NavBar />
    <Snackbar />
    <Sidebar.Pushable as="div">
      <TasksSidebar />
      <Sidebar.Pusher as={Content}>
        <Routes />
      </Sidebar.Pusher>
    </Sidebar.Pushable>
    <GroupingTagModal />
    <LinkModal />
    <PlayerModal />
    <MarkupModal />
    <DictionaryProperties />
    <SaveDictionary />
    <PerspectiveProperties />
    <PhonemicAnalysisModal />
    <PhonologyModal />
    <ConverEafModal />
    <StatisticsModal />
    <BanModal />
    <LexicalEntryModal />
  </div>
);

export default Layout;
