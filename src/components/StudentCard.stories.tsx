import type { Meta, StoryObj } from '@storybook/react';
import { StudentCard } from './StudentCard';

const meta = {
  title: 'Components/StudentCard',
  component: StudentCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StudentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockOnUpdate = () => console.log('Update clicked');

export const Default: Story = {
  args: {
    student: {
      id: '1',
      first_name: 'Jean',
      last_name: 'Dupont',
      class_name: 'B3',
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      age: 22,
      birth_date: '2002-03-15',
      academic_background: 'Licence Économie',
      company: 'Entreprise XYZ',
      special_needs: null,
    },
    onUpdate: mockOnUpdate,
  },
};

export const WithoutPhoto: Story = {
  args: {
    student: {
      ...Default.args!.student!,
      photo_url: null,
    },
    onUpdate: mockOnUpdate,
  },
};

export const WithSpecialNeeds: Story = {
  args: {
    student: {
      ...Default.args!.student!,
      special_needs: 'Dyslexie',
    },
    onUpdate: mockOnUpdate,
  },
};

export const LongNames: Story = {
  args: {
    student: {
      ...Default.args!.student!,
      first_name: 'Jean-Baptiste',
      last_name: 'De La Fontaine-Maupassant',
      company: 'Très Longue Entreprise Avec Un Nom Interminable SARL',
    },
    onUpdate: mockOnUpdate,
  },
};
