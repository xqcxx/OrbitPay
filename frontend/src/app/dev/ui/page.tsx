'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Send, Check, AlertTriangle, Info, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function UIGalleryPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsyncAction = () => {
    setIsLoading(true);
    toast('Processing transaction...', 'loading', 2000);
    setTimeout(() => {
      setIsLoading(false);
      toast('Transaction successful!', 'success');
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-12 space-y-16 pb-32">
      <header>
        <h1 className="text-5xl font-black text-white mb-4 tracking-tight">UI Primitives</h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Reusable, premium component library built for the OrbitPay dashboard with a focus on glassmorphism and motion.
        </p>
      </header>

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Primary to ghost actions</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>States & Icons</CardTitle>
              <CardDescription>Loading and icon support</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button isLoading>Loading</Button>
              <Button leftIcon={<Plus size={16} />}>Add Item</Button>
              <Button rightIcon={<ExternalLink size={16} />} variant="outline">View</Button>
              <Button disabled>Disabled</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sizes</CardTitle>
              <CardDescription>From small to large</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large Action</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Badges</h2>
        <Card>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Solid Variants</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Outline Variants</p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default" outline>Default</Badge>
                <Badge variant="success" outline>Success</Badge>
                <Badge variant="warning" outline>Warning</Badge>
                <Badge variant="error" outline>Error</Badge>
                <Badge variant="info" outline>Info</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Interactive Elements */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Interactive</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Modal</CardTitle>
              <CardDescription>Overlay with backdrop blur</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="w-full">
                Open Modal Example
              </Button>
              <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="Transaction Details"
                size="md"
              >
                <ModalContent>
                  <p className="text-gray-400">
                    This is a reusable modal component. It handles backdrop clicks, escape key, and scroll locking automatically.
                  </p>
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-2xl border border-gray-700 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Proposal ID</span>
                      <span className="text-white font-mono">#42</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <Badge variant="success">Approved</Badge>
                    </div>
                  </div>
                </ModalContent>
                <ModalFooter>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsModalOpen(false)}>Confirm Action</Button>
                </ModalFooter>
              </Modal>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Toasts</CardTitle>
              <CardDescription>Context-driven notifications</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button onClick={() => toast('Operation successful!', 'success')} variant="outline" className="text-xs">
                Success Toast
              </Button>
              <Button onClick={() => toast('Something went wrong', 'error')} variant="outline" className="text-xs">
                Error Toast
              </Button>
              <Button onClick={() => toast('New update available', 'info')} variant="outline" className="text-xs">
                Info Toast
              </Button>
              <Button onClick={handleAsyncAction} variant="primary" className="text-xs" isLoading={isLoading}>
                Async Flow
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feedback & Loading */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-2">Loaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Skeletons</CardTitle>
              <CardDescription>Pulsing loading placeholders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton variant="circle" className="w-12 h-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-1/3" />
                  <Skeleton variant="text" className="w-full" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                 <Skeleton className="h-10 flex-1" />
                 <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
