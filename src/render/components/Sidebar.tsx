import GroupSelector from './GroupSelector';
import StudentJournal from './StudentJournal';
import type { SelectedGroup, Class, Lesson } from '../types';
// import {useState, useEffect } from "react";
// import type { Dispatch, SetStateAction } from 'react';

interface SidebarProps {
  appData: Class[] | null;
  loading: boolean;
  selectedGroup: SelectedGroup | null;
  currentLesson: Lesson | null;
  getStudentName: (name: string) => string;
  onGroupSelect: (groupId: string) => void;
  onBackToGroups: () => void;
  onUpdateGrade: (lessonId: string, studentId: string, grade: number | null) => Promise<void>;
  onUpdateAttendance: (lessonId: string, studentId: string, attendance: boolean) => Promise<void>;
}

const Sidebar = ({ 
  appData,
  loading, 
  selectedGroup,
  currentLesson,
  getStudentName,
  onGroupSelect,
  onBackToGroups,
  onUpdateGrade,
  onUpdateAttendance,
}: SidebarProps) => {

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {!selectedGroup ? (
            <GroupSelector
              appData={appData}
              loading={loading}
              onGroupSelect={onGroupSelect}
            />
        ) : (
          currentLesson && (
            <StudentJournal
              selectedGroup={selectedGroup}
              currentLesson={currentLesson}
              getStudentName={getStudentName}
              onBack={onBackToGroups}
              onUpdateGrade={onUpdateGrade}
              onUpdateAttendance={onUpdateAttendance}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;