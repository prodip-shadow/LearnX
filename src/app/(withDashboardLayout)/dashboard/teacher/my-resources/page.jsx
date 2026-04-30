import MyResourcesList from '@/components/ResourceComponents/MyResourcesList';

export const metadata = {
  title: 'My Resources - Teacher Dashboard',
};

export default function MyResourcesPage() {
  return (
    <div className="min-h-screen bg-page">
      <MyResourcesList />
    </div>
  );
}
