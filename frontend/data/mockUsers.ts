import { User } from '../types';

export const mockUsers = [
  {
    email: 'admin@nirmandrishti.gov.in',
    role: 'admin',
  },
  {
    email: 'ministry@nirmandrishti.gov.in',
    role: 'ministry',
    scopedMinistry: 'Ministry of Road Transport and Highways',
  },
  {
    email: 'agency@nirmandrishti.gov.in',
    role: 'agency',
    scopedAgencyProjects: ['NHAI-RD-0', 'NHAI-RD-1', 'NHAI-RD-2'],
  }
];
