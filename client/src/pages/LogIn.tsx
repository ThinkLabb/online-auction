import LogInForm from '../components/login-form.tsx';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground">Sign in and get started</p>
        </div>
        <LogInForm />
      </div>
    </main>
  );
}
