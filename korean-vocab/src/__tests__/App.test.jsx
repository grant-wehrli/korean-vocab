import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders HomeView by default', () => {
    render(<App />);
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });

  it('navigates to SelectSetsView when Study button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /study/i }));
    expect(screen.getByText('Select Sets')).toBeInTheDocument();
  });

  it('navigates to StatsView when Stats button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('navigates to ImportView when Import button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('navigates back to HomeView from StatsView', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /stats/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });

  it('navigates back to HomeView from ImportView', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });

  it('navigates back to HomeView from SelectSetsView', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /study/i }));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });

  it('startSession transitions to StudyView; endSession returns to HomeView', () => {
    render(<App />);
    // Navigate to SelectSets
    fireEvent.click(screen.getByRole('button', { name: /study/i }));
    // Select the first builtin set (Greetings)
    fireEvent.click(screen.getByText('Greetings'));
    // Start the session — calls startSession
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    // StudyView should be visible (shows counter like "1/N")
    expect(screen.getByText(/\d+\/\d+/)).toBeInTheDocument();
    // Exit the study session — calls endSession
    fireEvent.click(screen.getByRole('button', { name: /✕/i }));
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });
});
