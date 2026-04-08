// Position Templates for Different Election Types
// These are predefined positions that auto-populate based on election type

export interface PositionTemplate {
  name: string
  description: string
  maxSelections: number
  order: number
}

export const POSITION_TEMPLATES: Record<string, PositionTemplate[]> = {
  PRESIDENTIAL: [
    {
      name: 'President',
      description: 'Chief Executive Officer of the student body',
      maxSelections: 1,
      order: 1
    },
    {
      name: 'Vice President',
      description: 'Deputy to the President',
      maxSelections: 1,
      order: 2
    },
    {
      name: 'Secretary General',
      description: 'Head of administrative affairs',
      maxSelections: 1,
      order: 3
    },
    {
      name: 'Treasurer',
      description: 'Financial controller and accountant',
      maxSelections: 1,
      order: 4
    }
  ],

  STUDENT_UNION: [
    {
      name: 'President',
      description: 'Leader of the student union',
      maxSelections: 1,
      order: 1
    },
    {
      name: 'Vice President',
      description: 'Deputy leader of the student union',
      maxSelections: 1,
      order: 2
    },
    {
      name: 'Secretary',
      description: 'Records and correspondence officer',
      maxSelections: 1,
      order: 3
    },
    {
      name: 'Treasurer',
      description: 'Financial officer',
      maxSelections: 1,
      order: 4
    },
    {
      name: 'Organizing Secretary',
      description: 'Coordinates events and activities',
      maxSelections: 1,
      order: 5
    },
    {
      name: 'Public Relations Officer',
      description: 'Handles communication and media',
      maxSelections: 1,
      order: 6
    },
    {
      name: 'Sports Secretary',
      description: 'Oversees sports and athletics',
      maxSelections: 1,
      order: 7
    },
    {
      name: 'Welfare Secretary',
      description: 'Handles student welfare matters',
      maxSelections: 1,
      order: 8
    }
  ],

  DEPARTMENTAL: [
    {
      name: 'Department President',
      description: 'Head of department student representatives',
      maxSelections: 1,
      order: 1
    },
    {
      name: 'Vice President',
      description: 'Deputy department representative',
      maxSelections: 1,
      order: 2
    },
    {
      name: 'Secretary',
      description: 'Department records keeper',
      maxSelections: 1,
      order: 3
    },
    {
      name: 'Treasurer',
      description: 'Department financial officer',
      maxSelections: 1,
      order: 4
    },
    {
      name: 'Class Representatives',
      description: 'Representatives for different year levels',
      maxSelections: 4,
      order: 5
    }
  ],

  FACULTY: [
    {
      name: 'Faculty President',
      description: 'Leader of faculty student council',
      maxSelections: 1,
      order: 1
    },
    {
      name: 'Vice President',
      description: 'Deputy faculty leader',
      maxSelections: 1,
      order: 2
    },
    {
      name: 'Secretary',
      description: 'Faculty administrative officer',
      maxSelections: 1,
      order: 3
    },
    {
      name: 'Treasurer',
      description: 'Faculty financial manager',
      maxSelections: 1,
      order: 4
    },
    {
      name: 'Academic Affairs Officer',
      description: 'Handles academic matters',
      maxSelections: 1,
      order: 5
    },
    {
      name: 'Social Affairs Officer',
      description: 'Organizes social events',
      maxSelections: 1,
      order: 6
    }
  ],

  CLUB: [
    {
      name: 'Chairperson',
      description: 'Leader of the club',
      maxSelections: 1,
      order: 1
    },
    {
      name: 'Vice Chairperson',
      description: 'Deputy club leader',
      maxSelections: 1,
      order: 2
    },
    {
      name: 'Secretary',
      description: 'Club records and communication',
      maxSelections: 1,
      order: 3
    },
    {
      name: 'Treasurer',
      description: 'Club financial officer',
      maxSelections: 1,
      order: 4
    },
    {
      name: 'Committee Members',
      description: 'General committee members',
      maxSelections: 5,
      order: 5
    }
  ],

  SOCIETY: [
    {
      name: 'Patron',
      description: 'Society patron or advisor',
      maxSelections: 1,
      order: 1
    },
    {
      name: 'President',
      description: 'Leader of the society',
      maxSelections: 1,
      order: 2
    },
    {
      name: 'Vice President',
      description: 'Deputy society leader',
      maxSelections: 1,
      order: 3
    },
    {
      name: 'Secretary',
      description: 'Society administrative officer',
      maxSelections: 1,
      order: 4
    },
    {
      name: 'Treasurer',
      description: 'Society financial manager',
      maxSelections: 1,
      order: 5
    },
    {
      name: 'Project Coordinator',
      description: 'Manages society projects',
      maxSelections: 1,
      order: 6
    }
  ],

  REFERENDUM: [
    {
      name: 'Yes/No Vote',
      description: 'Vote for or against the proposal',
      maxSelections: 1,
      order: 1
    }
  ],

  POLL: [
    {
      name: 'Poll Options',
      description: 'Select your preferred option',
      maxSelections: 1,
      order: 1
    }
  ]
}

// Get position templates for a specific election type
export const getPositionTemplates = (electionType: string): PositionTemplate[] => {
  return POSITION_TEMPLATES[electionType] || []
}

// Get all election types that have position templates
export const getElectionTypesWithTemplates = (): string[] => {
  return Object.keys(POSITION_TEMPLATES)
}

// Check if an election type has position templates
export const hasPositionTemplates = (electionType: string): boolean => {
  return electionType in POSITION_TEMPLATES && POSITION_TEMPLATES[electionType].length > 0
}

// Get a single position template by name and election type
export const getPositionTemplate = (
  electionType: string,
  positionName: string
): PositionTemplate | undefined => {
  const templates = POSITION_TEMPLATES[electionType] || []
  return templates.find(t => t.name === positionName)
}

// Export for use in other files
export default POSITION_TEMPLATES
