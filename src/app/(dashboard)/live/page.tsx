import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VisitorFeed } from '@/components/visitor-feed';

export default async function LivePage() {
  const supabase = await createClient();

  // Get user's first project (or redirect to create one)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1);

  if (!projects || projects.length === 0) {
    redirect('/projects/new');
  }

  const project = projects[0];

  return (
    <VisitorFeed
      projectId={project.id}
      projectName={project.name}
    />
  );
}
