import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

export interface ClassData {
  id: string;
  name: string;
  section: string;
  code: string;
  studentCount: number;
}

interface ClassCardProps {
  classData: ClassData;
  onOpenClass: (classData: ClassData) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classData, onOpenClass }) => {
  const { t } = useTranslations();

  return (
    <div className="bg-brand-mid-purple/80 rounded-2xl p-4 text-center text-white space-y-3 border border-brand-light-purple/50 shadow-lg">
      <h3 className="font-bold text-xl">{`${classData.name} - ${classData.section}`}</h3>
      <p className="text-md">{`${classData.studentCount} ${t('students')}`}</p>
      <p className="text-md font-semibold">{`${t('classCode')}: ${classData.code}`}</p>

      <button
        onClick={() => onOpenClass(classData)}
        className="w-4/5 bg-gradient-to-r from-blue-500 to-brand-accent text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75"
      >
        {t('openClass')}
      </button>
    </div>
  );
};

export default ClassCard;
