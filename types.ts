
export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  cause: string;
  effect: string;
  claim: string;
  relief: string;
}

export interface TimelineMonth {
  month: string;
  events: TimelineEvent[];
}

export interface ReportSection {
  id: string;
  title: string;
  content: string | JSX.Element;
}

export interface Document {
  id: string;
  title: string;
  content: string;
}
