import { DiaryEditor } from '@/components/editor/DiaryEditor';
import { OnboardingModal } from '@/components/settings/OnboardingModal';
import { MonthCalendar } from '@/components/streak/MonthCalendar';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <OnboardingModal />
      <DiaryEditor />
      <div className="mt-8">
        <MonthCalendar />
      </div>
    </div>
  );
}
